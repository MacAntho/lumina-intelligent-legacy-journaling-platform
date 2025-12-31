import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { format, isSameDay } from "date-fns";
import type { Env } from './core-utils';
import {
  UserAuthEntity, JournalEntity, EntryEntity,
  LegacyContactEntity, LegacyShareEntity, ExportLogEntity,
  LegacyAuditLogEntity, NotificationEntity,
  SavedSearchEntity, PromptEntity
} from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { LoginRequest, RegisterRequest, DailyContent } from "@shared/types";
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
  return {
    prompt: selection.prompt,
    affirmation: selection.affirmation
  };
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Public Access Routes...
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
    await LegacyAuditLogEntity.create(c.env, {
      id: crypto.randomUUID(), userId: share.userId, shareId: share.id,
      journalId: share.journalId, recipientEmail: share.recipientEmail,
      action: 'view', timestamp: new Date().toISOString()
    });
    return ok(c, data);
  });
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
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    return userAuth ? ok(c, userAuth.profile) : notFound(c);
  });
  app.get('/api/ai/daily', async (c) => {
    const payload = c.get('jwtPayload');
    const refresh = c.req.query('refresh') === 'true';
    const history = await PromptEntity.listByUser(c.env, payload.userId);
    const todayPrompt = history.find(p => p.type === 'daily' && isSameDay(new Date(p.createdAt), new Date()));
    if (todayPrompt && !refresh) {
      return ok(c, { prompt: todayPrompt.prompt, affirmation: todayPrompt.affirmation });
    }
    const recentContent = await EntryEntity.getRecentEntriesContent(c.env, payload.userId);
    const content = generateDailyPrompt(recentContent);
    const journals = await JournalEntity.listByUser(c.env, payload.userId);
    const targetJournalId = journals[0]?.id;
    const newPrompt = await PromptEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: payload.userId,
      prompt: content.prompt,
      affirmation: content.affirmation,
      targetJournalId,
      type: 'daily',
      createdAt: new Date().toISOString()
    });
    return ok(c, { prompt: newPrompt.prompt, affirmation: newPrompt.affirmation, targetJournalId });
  });
  app.post('/api/ai/prompts/contextual', async (c) => {
    const payload = c.get('jwtPayload');
    const { journalId, templateId } = await c.req.json();
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    const content = entries.slice(0, 3).map(e => e.content).join("\n");
    const suggestion = generateDailyPrompt(content);
    await PromptEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: payload.userId,
      prompt: suggestion.prompt,
      affirmation: suggestion.affirmation,
      targetJournalId: journalId,
      type: 'contextual',
      createdAt: new Date().toISOString()
    });
    return ok(c, suggestion);
  });
  app.get('/api/ai/prompts/history', async (c) => {
    const payload = c.get('jwtPayload');
    const items = await PromptEntity.listByUser(c.env, payload.userId);
    return ok(c, items.filter(p => p.type === 'daily').slice(0, 10));
  });
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const journals = await JournalEntity.listByUser(c.env, payload.userId);
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const enriched = journals.map(j => {
      const journalEntries = entries.filter(e => e.journalId === j.id);
      return { ...j, entryCount: journalEntries.length, lastEntryAt: journalEntries[0]?.date };
    });
    return ok(c, enriched);
  });
  app.get('/api/notifications', async (c) => {
    const payload = c.get('jwtPayload');
    const notes = await NotificationEntity.listByUser(c.env, payload.userId);
    return ok(c, notes);
  });
}