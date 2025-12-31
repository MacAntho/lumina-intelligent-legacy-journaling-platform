import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import type { Env } from './core-utils';
import {
  UserAuthEntity, JournalEntity, EntryEntity,
  LegacyContactEntity, LegacyShareEntity, ExportLogEntity,
  LegacyAuditLogEntity, NotificationEntity,
  SavedSearchEntity, PromptEntity,
  AiInsightEntity, SecurityLogEntity, UsageEntity
} from "./entities";
import { chatWithAssistant, analyzeJournalPatterns } from "./intelligence";
import { ok, bad, notFound } from './core-utils';
import type {
  LoginRequest, RegisterRequest, User, AnalysisRange,
  ExportOptions, LegacyAuditLog, AiMessage
} from "@shared/types";
import { generateServerPdf } from "./pdf-service";
const JWT_SECRET = "lumina-secret-key-change-this";
async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "deriveKey"]);
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PUBLIC ROUTES ---
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
    const inputHash = await hashPassword(password, "static-legacy-salt");
    if (share.passwordHash !== inputHash) return bad(c, 'Incorrect password');
    const entries = await EntryEntity.listByJournal(c.env, share.journalId, "public");
    return ok(c, { entries });
  });
  app.post('/api/auth/forgot', async (c) => {
    const { email } = await c.req.json();
    return ok(c, { message: "Recovery dispatched if account exists.", debugToken: "LMN-DEBUG-" + Date.now().toString().slice(-6) });
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
    const currentMonth = now.slice(0, 7);
    const userAuth = await UserAuthEntity.create(c.env, {
      id: body.email.toLowerCase(),
      passwordHash: hash,
      salt,
      profile: {
        id: userId, name: body.name, email: body.email.toLowerCase(),
        preferences: { theme: 'system', notificationsEnabled: true, language: 'en', onboardingCompleted: false, e2eEnabled: false, analyticsOptIn: true, privacyLevel: 'standard', tier: 'free', subscriptionStatus: 'active', notificationSettings: { entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true }, quietHours: { start: "22:00", end: "08:00", enabled: false } },
        usage: { journalCount: 0, monthlyEntryCount: 0, lastResetMonth: currentMonth },
        createdAt: now, lastHeartbeatAt: now
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
  // --- AUTH PROTECTED ROUTES ---
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
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await JournalEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const data = await c.req.json();
    const journal = await JournalEntity.create(c.env, {
      ...JournalEntity.initialState,
      ...data,
      id: crypto.randomUUID(),
      userId: payload.userId,
      createdAt: new Date().toISOString()
    });
    return ok(c, journal);
  });
  app.delete('/api/journals/:id', async (c) => {
    const id = c.req.param('id');
    await JournalEntity.delete(c.env, id);
    return ok(c, { id });
  });
  app.get('/api/entries/all', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.param('id');
    const data = await c.req.json();
    const entry = await EntryEntity.create(c.env, {
      ...EntryEntity.initialState,
      ...data,
      id: crypto.randomUUID(),
      userId: payload.userId,
      journalId,
      date: new Date().toISOString()
    });
    return ok(c, entry);
  });
  app.get('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await LegacyContactEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    const data = await c.req.json();
    const contact = await LegacyContactEntity.create(c.env, {
      ...LegacyContactEntity.initialState,
      ...data,
      id: crypto.randomUUID(),
      userId: payload.userId
    });
    return ok(c, contact);
  });
  app.delete('/api/legacy-contacts/:id', async (c) => {
    const id = c.req.param('id');
    await LegacyContactEntity.delete(c.env, id);
    return ok(c, { id });
  });
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
  app.get('/api/ai/insights/history', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await AiInsightEntity.listByUser(c.env, payload.userId));
  });
  app.get('/api/ai/insights/patterns', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.query('journalId');
    const range = (c.req.query('range') || 'week') as AnalysisRange;
    if (!journalId) return bad(c, 'journalId required');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const journal = await new JournalEntity(c.env, journalId).getState();
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    const analysis = await analyzeJournalPatterns(userAuth!.profile.name, journal.title, entries, range);
    const insight = await AiInsightEntity.create(c.env, {
      ...analysis,
      id: crypto.randomUUID(),
      userId: payload.userId,
      journalId,
      range,
      createdAt: new Date().toISOString()
    });
    return ok(c, insight);
  });
  app.post('/api/ai/chat', async (c) => {
    const payload = c.get('jwtPayload');
    const { message, history } = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const response = await chatWithAssistant(userAuth!.profile.name, message, history, entries);
    return c.text(response);
  });
  app.get('/api/activity/stream', async (c) => {
    const payload = c.get('jwtPayload');
    const [exports, audits, security] = await Promise.all([
      ExportLogEntity.listByUser(c.env, payload.userId),
      LegacyAuditLogEntity.listByUser(c.env, payload.userId),
      SecurityLogEntity.listByUser(c.env, payload.userId)
    ]);
    const stream = [
      ...exports.map(e => ({ id: e.id, type: 'export' as const, title: 'Archive Exported', message: `Journal archive downloaded as ${e.format}.`, timestamp: e.timestamp })),
      ...audits.map(a => ({ id: a.id, type: 'transmission' as const, title: 'Legacy Transmission', message: `${a.recipientEmail} performed ${a.action}.`, timestamp: a.timestamp })),
      ...security.map(s => ({ id: s.id, type: 'security' as const, title: 'Security Event', message: s.event, timestamp: s.timestamp }))
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return ok(c, stream);
  });
  app.post('/api/legacy/generate-link', async (c) => {
    const payload = c.get('jwtPayload');
    const data = await c.req.json();
    const share = await LegacyShareEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: payload.userId,
      journalId: data.journalId,
      recipientEmail: data.recipientEmail,
      accessKey: crypto.randomUUID(),
      permissions: data.permissions,
      passwordHash: data.password ? await hashPassword(data.password, "static-legacy-salt") : undefined,
      passwordHint: data.passwordHint,
      viewCount: 0,
      createdAt: new Date().toISOString()
    });
    return ok(c, share);
  });
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
    await ExportLogEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId,
      timestamp: new Date().toISOString(), format: 'pdf', status: 'success', options
    });
    return new Response(pdfBytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="archive.pdf"' } });
  });
}