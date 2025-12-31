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
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json<RegisterRequest>();
    if (!body.email || !body.password || !body.name) return bad(c, 'Missing fields');
    const existing = await UserAuthEntity.findByEmail(c.env, body.email);
    if (existing) return bad(c, 'User already exists');
    const salt = crypto.randomUUID();
    const hash = await hashPassword(body.password, salt);
    const userId = crypto.randomUUID();
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
          notificationSettings: {
            entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true
          },
          quietHours: { start: "22:00", end: "08:00", enabled: false }
        },
        createdAt: new Date().toISOString(),
        lastHeartbeatAt: new Date().toISOString()
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
  app.get('/api/public/legacy/:shareId', async (c) => {
    const shareId = c.req.param('shareId');
    const key = c.req.query('key');
    const shareInst = new LegacyShareEntity(c.env, shareId);
    if (!(await shareInst.exists())) return notFound(c, 'Legacy archive not found');
    const share = await shareInst.getState();
    if (share.accessKey !== key) return bad(c, 'Invalid access key');
    const journal = await new JournalEntity(c.env, share.journalId).getState();
    const passwordRequired = !!share.passwordHash;
    const metadata = {
      journalTitle: journal.title,
      authorName: "A Lumina Resident",
      permissions: share.permissions,
      passwordRequired,
      passwordHint: share.passwordHint,
      expiresAt: share.expiresAt
    };
    if (passwordRequired) return ok(c, metadata);
    await LegacyAuditLogEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: share.userId,
      shareId: share.id,
      journalId: share.journalId,
      recipientEmail: share.recipientEmail,
      action: 'view',
      timestamp: new Date().toISOString()
    });
    await NotificationEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: share.userId,
      type: 'access',
      title: 'Legacy Archive Accessed',
      message: `Your journal "${journal.title}" was viewed by a recipient.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    const entries = await EntryEntity.listByJournal(c.env, share.journalId, share.userId);
    return ok(c, { ...metadata, entries: entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) });
  });
  app.post('/api/public/legacy/:shareId/verify', async (c) => {
    const shareId = c.req.param('shareId');
    const { password } = await c.req.json();
    const shareInst = new LegacyShareEntity(c.env, shareId);
    if (!(await shareInst.exists())) return notFound(c);
    const share = await shareInst.getState();
    if (share.passwordHash) {
      const hash = await hashPassword(password, "legacy-salt");
      if (hash !== share.passwordHash) return bad(c, 'Access Denied');
    }
    const journal = await new JournalEntity(c.env, share.journalId).getState();
    await LegacyAuditLogEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: share.userId,
      shareId: share.id,
      journalId: share.journalId,
      recipientEmail: share.recipientEmail,
      action: 'view',
      timestamp: new Date().toISOString()
    });
    const entries = await EntryEntity.listByJournal(c.env, share.journalId, share.userId);
    return ok(c, { journalTitle: journal.title, authorName: "A Lumina Resident", entries, permissions: share.permissions });
  });
  app.get('/api/searches', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await SavedSearchEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/searches', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const search = await SavedSearchEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      userId: payload.userId,
      createdAt: new Date().toISOString()
    });
    return ok(c, search);
  });
  app.delete('/api/searches/:id', async (c) => {
    const id = c.req.param('id');
    await SavedSearchEntity.delete(c.env, id);
    return ok(c, true);
  });
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.get('/api/activity/stream', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;
    const notes = await NotificationEntity.listByUser(c.env, userId);
    const audits = await LegacyAuditLogEntity.listByUser(c.env, userId);
    const exports = await ExportLogEntity.listByUser(c.env, userId);
    const journals = await JournalEntity.listByUser(c.env, userId);

    const stream: any[] = [
      ...notes.map(n => ({ id: n.id, type: 'system' as const, title: n.title, message: n.message, timestamp: n.createdAt, metadata: { noteType: n.type } })),
      ...audits.map(a => ({ id: a.id, type: 'transmission' as const, title: 'Legacy Access', message: `Archive for "${journals.find(j => j.id === a.journalId)?.title || 'Journal'}" was ${a.action}ed by ${a.recipientEmail}`, timestamp: a.timestamp, metadata: { action: a.action, email: a.recipientEmail } })),
      ...exports.map(e => ({ id: e.id, type: 'export' as const, title: 'Journal Export', message: `Exported to ${e.format.toUpperCase()} (${e.status})`, timestamp: e.timestamp, metadata: { format: e.format, status: e.status } }))
    ];
    return ok(c, stream.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50));
  });
  app.get('/api/notifications', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await NotificationEntity.listByUser(c.env, payload.userId));
  });
  app.patch('/api/notifications/:id/read', async (c) => {
    const id = c.req.param('id');
    const note = new NotificationEntity(c.env, id);
    if (await note.exists()) {
      await note.patch({ isRead: true });
      return ok(c, true);
    }
    return notFound(c);
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
  app.put('/api/auth/heartbeat', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const updatedProfile = { ...userAuth.profile, lastHeartbeatAt: new Date().toISOString() };
    await new UserAuthEntity(c.env, payload.email).patch({ profile: updatedProfile });
    return ok(c, updatedProfile);
  });
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    return userAuth ? ok(c, userAuth.profile) : notFound(c);
  });
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await JournalEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const journal = await JournalEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      userId: payload.userId,
      createdAt: new Date().toISOString()
    });
    return ok(c, journal);
  });
  app.get('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.param('id');
    const q = c.req.query('q')?.toLowerCase();
    const tag = c.req.query('tag');
    const mood = c.req.query('mood');
    const minWords = parseInt(c.req.query('minWords') || '0');
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    let filtered = entries;
    if (q) filtered = filtered.filter(e => e.content.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q));
    if (tag) filtered = filtered.filter(e => e.tags.includes(tag));
    if (mood) filtered = filtered.filter(e => e.mood === mood);
    if (minWords > 0) filtered = filtered.filter(e => (e.wordCount || 0) >= minWords);
    return ok(c, filtered);
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const content = body.content || '';
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const entry = await EntryEntity.create(c.env, {
      ...body,
      wordCount,
      id: crypto.randomUUID(),
      userId: payload.userId,
      journalId: c.req.param('id'),
      date: new Date().toISOString()
    });
    const journal = new JournalEntity(c.env, c.req.param('id'));
    if (await journal.exists()) await journal.patch({ lastEntryAt: entry.date });
    return ok(c, entry);
  });
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
    entries.slice(-50).forEach(e => {
      e.tags?.forEach(tag => { tagMap[tag] = (tagMap[tag] || 0) + 1; });
    });
    const topTopics = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([text, count]) => ({ text, value: Math.round((count / Math.max(1, entries.length)) * 100) }));
    return ok(c, { moodTrends, writingFrequency: Object.entries(frequency).map(([day, count]) => ({ day, count })), topTopics });
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
  app.post('/api/legacy/generate-link', async (c) => {
    const payload = c.get('jwtPayload');
    const { journalId, recipientEmail, permissions, password, passwordHint, expiryDays } = await c.req.json();
    const shareId = crypto.randomUUID();
    const accessKey = Math.random().toString(36).slice(-8);
    let passwordHash: string | undefined;
    if (password) passwordHash = await hashPassword(password, "legacy-salt");
    const expiresAt = expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : undefined;
    const share = await LegacyShareEntity.create(c.env, { id: shareId, journalId, userId: payload.userId, recipientEmail, accessKey, permissions, passwordHash, passwordHint, expiresAt, viewCount: 0, createdAt: new Date().toISOString() });
    const journal = await new JournalEntity(c.env, journalId).getState();
    await NotificationEntity.create(c.env, { id: crypto.randomUUID(), userId: payload.userId, type: 'share', title: 'Legacy Link Generated', message: `Archive for "${journal.title}" created.`, isRead: false, createdAt: new Date().toISOString() });
    await LegacyAuditLogEntity.create(c.env, { id: crypto.randomUUID(), userId: payload.userId, shareId, journalId, recipientEmail, action: 'create', timestamp: new Date().toISOString() });
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
  app.get('/api/exports', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await ExportLogEntity.listByUser(c.env, payload.userId));
  });
  app.post('/api/exports', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const log = await ExportLogEntity.create(c.env, { ...body, id: crypto.randomUUID(), userId: payload.userId, timestamp: new Date().toISOString() });
    const journal = await new JournalEntity(c.env, body.journalId).getState();
    await NotificationEntity.create(c.env, { id: crypto.randomUUID(), userId: payload.userId, type: 'export', title: 'Archive Exported', message: `"${journal.title}" exported to PDF.`, isRead: false, createdAt: new Date().toISOString() });
    return ok(c, log);
  });
}