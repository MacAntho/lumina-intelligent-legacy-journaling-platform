import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { isSameDay } from "date-fns";
import type { Env } from './core-utils';
import {
  UserAuthEntity, JournalEntity, EntryEntity,
  LegacyContactEntity, LegacyShareEntity, ExportLogEntity,
  LegacyAuditLogEntity, NotificationEntity,
  SavedSearchEntity, PromptEntity,
  AiInsightEntity
} from "./entities";
import { chatWithAssistant, analyzeJournalPatterns } from "./intelligence";
import { ok, bad, notFound } from './core-utils';
import type { LoginRequest, RegisterRequest, DailyContent, User, AnalysisRange } from "@shared/types";
const JWT_SECRET = "lumina-secret-key-change-this";
async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "deriveKey"]);
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
const TEMPLATE_PROMPTS = [
  { theme: 'growth', prompt: "In what way did you surprise yourself today?", affirmation: "I am constantly evolving." },
  { theme: 'stillness', prompt: "Where did you find a moment of silence in the noise?", affirmation: "Peace is my natural state." },
  { theme: 'gratitude', prompt: "Who is a person you've overlooked being thankful for?", affirmation: "My life is abundant." },
  { theme: 'challenge', prompt: "What is one difficult thing you're avoiding right now?", affirmation: "I am courageous in the face of fear." },
  { theme: 'creative', prompt: "If you had no constraints, what would you build today?", affirmation: "My imagination is a source of power." }
];
function generateDailyPrompt(recentContent: string): DailyContent {
  const words = recentContent.toLowerCase().split(/\W+/);
  let theme = 'growth';
  if (words.includes('stress') || words.includes('busy')) theme = 'stillness';
  if (words.includes('happy') || words.includes('thanks')) theme = 'gratitude';
  if (words.includes('fear') || words.includes('hard')) theme = 'challenge';
  if (words.includes('idea') || words.includes('art')) theme = 'creative';
  const selection = TEMPLATE_PROMPTS.find(p => p.theme === theme) || TEMPLATE_PROMPTS[0];
  return { prompt: selection.prompt, affirmation: selection.affirmation };
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Public Access Routes
  app.get('/api/public/legacy/:shareId', async (c) => {
    const shareId = c.req.param('shareId');
    const key = c.req.query('key');
    const inst = new LegacyShareEntity(c.env, shareId);
    if (!(await inst.exists())) return notFound(c, 'Archive not found');
    const share = await inst.getState();
    if (share.accessKey !== key) return bad(c, 'Invalid access key');
    const journal = new JournalEntity(c.env, share.journalId);
    const journalState = await journal.getState();
    const users = await UserAuthEntity.list(c.env);
    const author = users.items.find(u => u.profile.id === share.userId);
    const data = {
      journalTitle: journalState.title,
      authorName: author?.profile.name || 'Anonymous Author',
      passwordRequired: !!share.passwordHash,
      passwordHint: share.passwordHint,
      expiresAt: share.expiresAt,
      permissions: share.permissions,
      entries: share.passwordHash ? null : await EntryEntity.listByJournal(c.env, share.journalId, "public")
    };
    return ok(c, data);
  });
  app.post('/api/public/legacy/:shareId/verify', async (c) => {
    const shareId = c.req.param('shareId');
    const { password } = await c.req.json();
    const inst = new LegacyShareEntity(c.env, shareId);
    if (!(await inst.exists())) return notFound(c);
    const share = await inst.getState();
    const hash = await hashPassword(password, "legacy-salt"); // Simplified salt for public verification
    if (hash !== share.passwordHash) return bad(c, 'Incorrect password');
    const journal = new JournalEntity(c.env, share.journalId);
    const journalState = await journal.getState();
    const data = {
      journalTitle: journalState.title,
      authorName: 'Verified Author',
      passwordRequired: false,
      permissions: share.permissions,
      entries: await EntryEntity.listByJournal(c.env, share.journalId, "public")
    };
    return ok(c, data);
  });
  // Auth Routes
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json<RegisterRequest>();
    if (!body.email || !body.password || !body.name) return bad(c, 'Missing fields');
    const existing = await UserAuthEntity.findByEmail(c.env, body.email);
    if (existing) return bad(c, 'User already exists');
    const salt = crypto.randomUUID();
    const hash = await hashPassword(body.password, salt);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const userAuth = await UserAuthEntity.create(c.env, {
      id: body.email.toLowerCase(), passwordHash: hash, salt,
      profile: {
        id: userId, name: body.name, email: body.email.toLowerCase(),
        preferences: {
          theme: 'system', notificationsEnabled: true, language: 'en', onboardingCompleted: false,
          notificationSettings: {
            entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true
          },
          quietHours: { start: "22:00", end: "08:00", enabled: false }
        },
        createdAt: now, lastHeartbeatAt: now
      }
    });
    const token = await sign({ userId, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
    return ok(c, { user: userAuth.profile, token });
  });
  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json<LoginRequest>();
    const userAuth = await UserAuthEntity.findByEmail(c.env, body.email);
    if (!userAuth) return bad(c, 'Invalid credentials');
    const hash = await hashPassword(body.password, userAuth.salt);
    if (hash !== userAuth.passwordHash) return bad(c, 'Invalid credentials');
    const updatedProfile = { ...userAuth.profile, lastHeartbeatAt: new Date().toISOString() };
    await new UserAuthEntity(c.env, body.email.toLowerCase()).patch({ profile: updatedProfile });
    const token = await sign({ userId: userAuth.profile.id, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
    return ok(c, { user: updatedProfile, token });
  });
  // Protected Routes Middleware
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    return userAuth ? ok(c, userAuth.profile) : notFound(c);
  });
  app.put('/api/auth/settings', async (c) => {
    const payload = c.get('jwtPayload');
    const updates = await c.req.json<Partial<User>>();
    const userAuth = new UserAuthEntity(c.env, payload.email);
    const current = await userAuth.getState();
    const updated = { ...current.profile, ...updates };
    await userAuth.patch({ profile: updated });
    return ok(c, updated);
  });
  app.put('/api/auth/heartbeat', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = new UserAuthEntity(c.env, payload.email);
    const current = await userAuth.getState();
    const updated = { ...current.profile, lastHeartbeatAt: new Date().toISOString() };
    await userAuth.patch({ profile: updated });
    return ok(c, updated);
  });

  // AI Pattern Insights
  app.get('/api/ai/insights/patterns', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.query('journalId');
    const range = (c.req.query('range') || 'week') as AnalysisRange;

    if (!journalId) return bad(c, 'Journal ID required');

    const journal = new JournalEntity(c.env, journalId);
    const journalState = await journal.getState();
    if (journalState.userId !== payload.userId) return bad(c, 'Forbidden');

    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    // Filter entries by range
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const ranges = { week: 7, month: 30, year: 365, all: 99999 };
    const limit = ranges[range] * msPerDay;
    const filtered = entries.filter(e => now - new Date(e.date).getTime() < limit);

    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const analysis = await analyzeJournalPatterns(userAuth?.profile.name || 'Explorer', journalState.title, filtered, range);

    const insight = await AiInsightEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId, range,
      ...analysis, createdAt: new Date().toISOString()
    });

    return ok(c, insight);
  });

  app.get('/api/ai/insights/history', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await AiInsightEntity.listByUser(c.env, payload.userId));
  });

  app.delete('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    await UserAuthEntity.purgeAllUserData(c.env, payload.userId, payload.email);
    return ok(c, { message: 'Sanctuary purged' });
  });
  // AI & Daily Routes
  app.get('/api/ai/daily', async (c) => {
    const payload = c.get('jwtPayload');
    const refresh = c.req.query('refresh') === 'true';
    const history = await PromptEntity.listByUser(c.env, payload.userId);
    const todayPrompt = history.find(p => p.type === 'daily' && isSameDay(new Date(p.createdAt), new Date()));
    if (todayPrompt && !refresh) return ok(c, todayPrompt);
    const recentContent = await EntryEntity.getRecentEntriesContent(c.env, payload.userId);
    const content = generateDailyPrompt(recentContent);
    const journals = await JournalEntity.listByUser(c.env, payload.userId);
    const newPrompt = await PromptEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...content,
      targetJournalId: journals[0]?.id, type: 'daily', createdAt: new Date().toISOString()
    });
    return ok(c, newPrompt);
  });
  app.get('/api/ai/prompts/history', async (c) => {
    const payload = c.get('jwtPayload');
    const history = await PromptEntity.listByUser(c.env, payload.userId);
    return ok(c, history.filter(p => p.type === 'daily').slice(0, 10));
  });
  app.post('/api/ai/prompts/contextual', async (c) => {
    const payload = c.get('jwtPayload');
    const { journalId } = await c.req.json();
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    const content = entries.slice(0, 3).map(e => e.content).join("\n");
    const suggestion = generateDailyPrompt(content);
    return ok(c, suggestion);
  });
  // Journal & Entry CRUD
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await JournalEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const journal = await JournalEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, createdAt: new Date().toISOString()
    });
    return ok(c, journal);
  });
  app.delete('/api/journals/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const id = c.req.param('id');
    const journal = new JournalEntity(c.env, id);
    const state = await journal.getState();
    if (state.userId !== payload.userId) return bad(c, 'Forbidden');
    await JournalEntity.delete(c.env, id);
    return ok(c, { id });
  });
  app.get('/api/entries/all', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.listByUser(c.env, payload.userId));
  });
  app.get('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.listByJournal(c.env, c.req.param('id'), payload.userId));
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const entry = await EntryEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId: c.req.param('id'),
      ...body, date: new Date().toISOString()
    });
    return ok(c, entry);
  });
  // Legacy circle & Transmissions
  app.get('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await LegacyContactEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const contact = await LegacyContactEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, status: 'verified'
    });
    return ok(c, contact);
  });
  app.delete('/api/legacy-contacts/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const id = c.req.param('id');
    const contact = new LegacyContactEntity(c.env, id);
    if ((await contact.getState()).userId !== payload.userId) return bad(c, 'Forbidden');
    await LegacyContactEntity.delete(c.env, id);
    return ok(c, { id });
  });
  app.post('/api/legacy/generate-link', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const share = await LegacyShareEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId: body.journalId,
      recipientEmail: body.recipientEmail, accessKey: crypto.randomUUID(),
      passwordHash: body.password ? await hashPassword(body.password, "legacy-salt") : undefined,
      passwordHint: body.passwordHint, permissions: body.permissions,
      viewCount: 0, createdAt: new Date().toISOString()
    });
    return ok(c, share);
  });
  app.get('/api/legacy/audit', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await LegacyAuditLogEntity.listByUser(c.env, payload.userId));
  });
  // Exports
  app.get('/api/exports', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await ExportLogEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/exports', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const log = await ExportLogEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, timestamp: new Date().toISOString()
    });
    return ok(c, log);
  });
  // Notifications
  app.get('/api/notifications', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await NotificationEntity.listByUser(c.env, payload.userId));
  });
  app.patch('/api/notifications/:id/read', async (c) => {
    const id = c.req.param('id');
    await new NotificationEntity(c.env, id).patch({ isRead: true });
    return ok(c, { id });
  });
  app.post('/api/notifications/read-all', async (c) => {
    const payload = c.get('jwtPayload');
    await NotificationEntity.markAllAsRead(c.env, payload.userId);
    return ok(c, { success: true });
  });
  // Search
  app.get('/api/searches', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await SavedSearchEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/searches', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const s = await SavedSearchEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, createdAt: new Date().toISOString()
    });
    return ok(c, s);
  });
  app.get('/api/search/suggestions', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.getSuggestions(c.env, payload.userId));
  });
  // Activity stream aggregation
  app.get('/api/activity/stream', async (c) => {
    const payload = c.get('jwtPayload');
    const [exports, audits, prompts] = await Promise.all([
      ExportLogEntity.listByUser(c.env, payload.userId),
      LegacyAuditLogEntity.listByUser(c.env, payload.userId),
      PromptEntity.listByUser(c.env, payload.userId)
    ]);
    const stream = [
      ...exports.map(e => ({ id: e.id, type: 'export' as const, title: 'Export Generated', message: `Journal archive exported as ${e.format.toUpperCase()}`, timestamp: e.timestamp })),
      ...audits.map(a => ({ id: a.id, type: 'transmission' as const, title: 'Archive Accessed', message: `Archive viewed by ${a.recipientEmail}`, timestamp: a.timestamp })),
      ...prompts.map(p => ({ id: p.id, type: 'system' as const, title: 'Daily Prompt', message: p.prompt, timestamp: p.createdAt }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return ok(c, stream.slice(0, 50));
  });

  // AI Chat Route
  app.post('/api/ai/chat', async (c) => {
    const payload = c.get('jwtPayload');
    const { message, history } = await c.req.json();
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const response = await chatWithAssistant(userAuth?.profile.name || 'Explorer', message, history, entries.slice(0, 30));
    return ok(c, response);
  });
}