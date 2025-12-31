import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { isSameDay } from "date-fns";
import type { Env } from './core-utils';
import {
  UserAuthEntity, JournalEntity, EntryEntity,
  LegacyContactEntity, LegacyShareEntity, ExportLogEntity,
  LegacyAuditLogEntity, NotificationEntity,
  SavedSearchEntity, PromptEntity,
  AiInsightEntity, SecurityLogEntity, UsageEntity
} from "./entities";
import { chatWithAssistant, analyzeJournalPatterns } from "./intelligence";
import { ok, bad, notFound, isStr } from './core-utils';
import type { LoginRequest, RegisterRequest, DailyContent, User, AnalysisRange, SubscriptionTier, ExportOptions, LegacyAuditLog } from "@shared/types";
import { generateServerPdf } from "./pdf-service";
const JWT_SECRET = "lumina-secret-key-change-this";
async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "deriveKey"]);
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
const LIMITS = {
  free: { journals: 3, entriesPerMonth: 100 },
  premium: { journals: 1000, entriesPerMonth: 10000 },
  pro: { journals: 10000, entriesPerMonth: 100000 }
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PUBLIC ROUTES (No JWT required) ---
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
    // In a real app, use the same hashPassword logic
    const inputHash = await hashPassword(password, "static-legacy-salt"); 
    if (share.passwordHash !== inputHash) return bad(c, 'Incorrect password');
    const entries = await EntryEntity.listByJournal(c.env, share.journalId, "public");
    return ok(c, { entries });
  });
  app.post('/api/auth/forgot', async (c) => {
    const { email } = await c.req.json();
    return ok(c, { message: "Recovery dispatched if account exists.", debugToken: "LMN-123-RECOVERY" });
  });
  app.post('/api/auth/reset', async (c) => {
    return ok(c, { message: "Security barrier updated." });
  });
  // --- AUTH PROTECTED ROUTES ---
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json<RegisterRequest>();
    if (!body.email || !body.password || !body.name) return bad(c, 'Missing fields');
    const existing = await UserAuthEntity.findByEmail(c.env, body.email);
    if (existing) return bad(c, 'User already exists');
    const salt = crypto.randomUUID();
    const hash = await hashPassword(body.password, salt);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const currentMonth = now.slice(0, 7);
    const userAuth = await UserAuthEntity.create(c.env, {
      id: body.email.toLowerCase(),
      passwordHash: hash,
      salt,
      profile: {
        id: userId,
        name: body.name,
        email: body.email.toLowerCase(),
        preferences: {
          theme: 'system',
          notificationsEnabled: true,
          language: 'en',
          onboardingCompleted: false,
          e2eEnabled: false,
          analyticsOptIn: true,
          privacyLevel: 'standard',
          tier: 'free',
          subscriptionStatus: 'active',
          notificationSettings: {
            entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true
          },
          quietHours: { start: "22:00", end: "08:00", enabled: false }
        },
        usage: { journalCount: 0, monthlyEntryCount: 0, lastResetMonth: currentMonth },
        createdAt: now,
        lastHeartbeatAt: now
      }
    });
    await UsageEntity.create(c.env, { id: userId, journalCount: 0, monthlyEntryCount: 0, lastResetMonth: currentMonth });
    const token = await sign({ userId, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
    return ok(c, { user: userAuth.profile, token });
  });
  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json<LoginRequest>();
    const userAuth = await UserAuthEntity.findByEmail(c.env, body.email);
    if (!userAuth) return bad(c, 'Invalid credentials');
    const hash = await hashPassword(body.password, userAuth.salt);
    if (hash !== userAuth.passwordHash) return bad(c, 'Invalid credentials');
    const usage = await UsageEntity.getAndReset(c.env, userAuth.profile.id);
    const updatedProfile = { ...userAuth.profile, lastHeartbeatAt: new Date().toISOString(), usage };
    await new UserAuthEntity(c.env, body.email.toLowerCase()).patch({ profile: updatedProfile });
    const token = await sign({ userId: userAuth.profile.id, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
    return ok(c, { user: updatedProfile, token });
  });
  // JWT Middleware for everything else
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const usage = await UsageEntity.getAndReset(c.env, userAuth.profile.id);
    return ok(c, { ...userAuth.profile, usage });
  });
  app.put('/api/auth/settings', async (c) => {
    const payload = c.get('jwtPayload');
    const updates = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const updated = { ...userAuth.profile, ...updates };
    await new UserAuthEntity(c.env, payload.email).patch({ profile: updated });
    return ok(c, updated);
  });
  app.delete('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    await UserAuthEntity.purgeAllUserData(c.env, payload.userId, payload.email);
    return ok(c, { message: "Sanctuary purged." });
  });
  // Journals & Entries
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await JournalEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const usage = await UsageEntity.getAndReset(c.env, payload.userId);
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const tier = userAuth?.profile.preferences.tier || 'free';
    if (usage.journalCount >= LIMITS[tier].journals) return bad(c, 'Limit reached');
    const journal = await JournalEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, createdAt: new Date().toISOString()
    });
    await new UsageEntity(c.env, payload.userId).patch({ journalCount: usage.journalCount + 1 });
    return ok(c, journal);
  });
  app.delete('/api/journals/:id', async (c) => {
    const id = c.req.param('id');
    await JournalEntity.delete(c.env, id);
    return ok(c, true);
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const usage = await UsageEntity.getAndReset(c.env, payload.userId);
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const tier = userAuth?.profile.preferences.tier || 'free';
    if (usage.monthlyEntryCount >= LIMITS[tier].entriesPerMonth) return bad(c, 'Monthly limit reached');
    const entry = await EntryEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId: c.req.param('id'),
      ...body, date: new Date().toISOString()
    });
    await new UsageEntity(c.env, payload.userId).patch({ monthlyEntryCount: usage.monthlyEntryCount + 1 });
    return ok(c, entry);
  });
  app.get('/api/entries/all', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.listByUser(c.env, payload.userId));
  });
  // AI & Insights
  app.post('/api/ai/chat', async (c) => {
    const payload = c.get('jwtPayload');
    const { message, history } = await c.req.json();
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const response = await chatWithAssistant(userAuth?.profile.name || "Explorer", message, history, entries);
    return ok(c, response);
  });
  app.get('/api/ai/insights/patterns', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.query('journalId');
    const range = (c.req.query('range') || 'week') as AnalysisRange;
    const entries = await EntryEntity.listByJournal(c.env, journalId || "", payload.userId);
    const journal = await new JournalEntity(c.env, journalId || "").getState();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const insightData = await analyzeJournalPatterns(userAuth?.profile.name || "Explorer", journal.title, entries, range);
    const insight = await AiInsightEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId: journalId || "",
      range, createdAt: new Date().toISOString(), ...insightData
    });
    return ok(c, insight);
  });
  app.get('/api/ai/insights/history', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await AiInsightEntity.listByUser(c.env, payload.userId));
  });
  app.get('/api/ai/daily', async (c) => {
    return ok(c, { prompt: "How did you find stillness today?", affirmation: "I am the architect of my own growth." });
  });
  // Notifications & Activity
  app.get('/api/notifications', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await NotificationEntity.listByUser(c.env, payload.userId));
  });
  app.patch('/api/notifications/:id/read', async (c) => {
    await new NotificationEntity(c.env, c.req.param('id')).patch({ isRead: true });
    return ok(c, true);
  });
  app.post('/api/notifications/read-all', async (c) => {
    const payload = c.get('jwtPayload');
    await NotificationEntity.markAllAsRead(c.env, payload.userId);
    return ok(c, true);
  });
  // Search & Suggestions
  app.get('/api/searches', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await SavedSearchEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/searches', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const search = await SavedSearchEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, createdAt: new Date().toISOString()
    });
    return ok(c, search);
  });
  app.get('/api/search/suggestions', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.getSuggestions(c.env, payload.userId));
  });
  // Exports
  app.get('/api/export/pdf', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.query('journalId') || "";
    const options: ExportOptions = {
      title: c.req.query('title') || "Journal Archive",
      author: c.req.query('author') || "Lumina Author",
      includeImages: c.req.query('images') === 'true',
      includeTags: c.req.query('tags') === 'true',
      highContrast: c.req.query('contrast') === 'true',
      customMessage: c.req.query('message') || ""
    };
    const journal = await new JournalEntity(c.env, journalId).getState();
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    const pdfBytes = await generateServerPdf(journal, entries, options);
    return new Response(pdfBytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="archive.pdf"' } });
  });
}