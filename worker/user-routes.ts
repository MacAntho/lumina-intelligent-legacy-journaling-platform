import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { format } from "date-fns";
import type { Env } from './core-utils';
import {
  UserAuthEntity, JournalEntity, EntryEntity,
  LegacyContactEntity, LegacyShareEntity, ExportLogEntity,
  LegacyAuditLogEntity, NotificationEntity,
  SavedSearchEntity
} from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { LoginRequest, RegisterRequest } from "@shared/types";
const JWT_SECRET = "lumina-secret-key-change-this";
async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "deriveKey"]);
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Public Routes
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
          notificationSettings: {
            entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true
          },
          quietHours: { start: "22:00", end: "08:00", enabled: false }
        },
        createdAt: now,
        lastHeartbeatAt: now
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
  app.post('/api/auth/forgot', async (c) => {
    const { email } = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, email);
    if (!userAuth) return ok(c, { message: 'If the account exists, a reset link will be sent.' });
    const token = Math.random().toString(36).slice(-10);
    await new UserAuthEntity(c.env, email.toLowerCase()).patch({
      resetToken: token,
      resetExpires: new Date(Date.now() + 3600000).toISOString()
    });
    return ok(c, { message: 'Reset link generated', debugToken: token });
  });
  app.post('/api/auth/reset', async (c) => {
    const { token, password } = await c.req.json();
    const { items } = await UserAuthEntity.list(c.env);
    const user = items.find(u => u.resetToken === token && new Date(u.resetExpires!) > new Date());
    if (!user) return bad(c, 'Invalid or expired token');
    const newHash = await hashPassword(password, user.salt);
    await new UserAuthEntity(c.env, user.id).patch({
      passwordHash: newHash,
      resetToken: undefined,
      resetExpires: undefined
    });
    return ok(c, { success: true });
  });
  // Protected Routes
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.post('/api/auth/logout', async (c) => ok(c, true));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    return userAuth ? ok(c, userAuth.profile) : notFound(c);
  });
  app.delete('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    await UserAuthEntity.purgeAllUserData(c.env, payload.userId, payload.email);
    return ok(c, true);
  });
  app.put('/api/auth/settings', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const updatedProfile = { ...userAuth.profile, preferences: { ...userAuth.profile.preferences, ...body } };
    await new UserAuthEntity(c.env, payload.email).patch({ profile: updatedProfile });
    return ok(c, updatedProfile);
  });
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const journals = await JournalEntity.listByUser(c.env, payload.userId);
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const enriched = journals.map(j => {
      const journalEntries = entries.filter(e => e.journalId === j.id);
      return {
        ...j,
        entryCount: journalEntries.length,
        lastEntryAt: journalEntries[0]?.date
      };
    });
    return ok(c, enriched);
  });
  app.get('/api/search/suggestions', async (c) => {
    const payload = c.get('jwtPayload');
    const suggestions = await EntryEntity.getSuggestions(c.env, payload.userId);
    return ok(c, suggestions);
  });
  app.get('/api/notifications', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await NotificationEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/notifications/read-all', async (c) => {
    const payload = c.get('jwtPayload');
    await NotificationEntity.markAllAsRead(c.env, payload.userId);
    return ok(c, true);
  });
  app.delete('/api/notifications/:id', async (c) => {
    const id = c.req.param('id');
    await NotificationEntity.delete(c.env, id);
    return ok(c, true);
  });
  app.get('/api/activity/stream', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const notes = await NotificationEntity.listByUser(c.env, userId);
    const audits = await LegacyAuditLogEntity.listByUser(c.env, userId);
    const exports = await ExportLogEntity.listByUser(c.env, userId);
    const journals = await JournalEntity.listByUser(c.env, userId);
    const stream = [
      ...notes.map(n => ({ id: n.id, type: 'system' as const, title: n.title, message: n.message, timestamp: n.createdAt })),
      ...audits.map(a => ({ id: a.id, type: 'transmission' as const, title: 'Legacy Access', message: `Archive for "${journals.find(j => j.id === a.journalId)?.title || 'Journal'}" was ${a.action}ed by ${a.recipientEmail}`, timestamp: a.timestamp })),
      ...exports.map(e => ({ id: e.id, type: 'export' as const, title: 'Journal Export', message: `Exported to ${e.format.toUpperCase()} (${e.status})`, timestamp: e.timestamp }))
    ];
    return ok(c, stream.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50));
  });
  // Insights, Sharing, Exports (Standard IndexedEntity CRUD)
  app.get('/api/insights', async (c) => {
    const payload = c.get('jwtPayload');
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const frequency: Record<string, number> = { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 };
    sortedEntries.forEach(e => {
      const day = format(new Date(e.date), 'eee');
      if (frequency[day] !== undefined) frequency[day]++;
    });
    const moodTrends = sortedEntries.slice(-14).map(e => ({
      date: format(new Date(e.date), 'MM-dd'),
      score: Number(e.structuredData?.mood_score || e.structuredData?.intensity || 3)
    }));
    const tagMap: Record<string, number> = {};
    entries.slice(-50).forEach(e => { e.tags?.forEach(tag => { tagMap[tag] = (tagMap[tag] || 0) + 1; }); });
    const topTopics = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([text, count]) => ({ text, value: Math.round((count / Math.max(1, entries.length)) * 100) }));
    return ok(c, { moodTrends, writingFrequency: Object.entries(frequency).map(([day, count]) => ({ day, count })), topTopics });
  });
  app.post('/api/legacy/generate-link', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const shareId = crypto.randomUUID();
    const accessKey = Math.random().toString(36).slice(-8);
    const share = await LegacyShareEntity.create(c.env, { ...body, id: shareId, userId: payload.userId, accessKey, viewCount: 0, createdAt: new Date().toISOString() });
    return ok(c, share);
  });
  app.get('/api/legacy/audit', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await LegacyAuditLogEntity.listByUser(c.env, payload.userId));
  });
  app.get('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await LegacyContactEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const contact = await LegacyContactEntity.create(c.env, { ...body, id: crypto.randomUUID(), userId: payload.userId, status: 'pending', assignedJournalIds: [] });
    return ok(c, contact);
  });
  app.delete('/api/legacy-contacts/:id', async (c) => {
    const id = c.req.param('id');
    await LegacyContactEntity.delete(c.env, id);
    return ok(c, true);
  });
  app.post('/api/exports', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const log = await ExportLogEntity.create(c.env, { ...body, id: crypto.randomUUID(), userId: payload.userId, timestamp: new Date().toISOString() });
    return ok(c, log);
  });
}