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
  // Public Access Routes for Legacy Transmissions
  app.get('/api/public/legacy/:shareId', async (c) => {
    const shareId = c.req.param('shareId');
    const key = c.req.query('key');
    const inst = new LegacyShareEntity(c.env, shareId);
    if (!(await inst.exists())) return notFound(c, 'Archive not found');
    const share = await inst.getState();
    if (share.accessKey !== key) return bad(c, 'Invalid access key');
    const journal = new JournalEntity(c.env, share.journalId);
    const journalState = await journal.getState();
    // Find author profile
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
    // Log the view action
    await LegacyAuditLogEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: share.userId,
      shareId: share.id,
      journalId: share.journalId,
      recipientEmail: share.recipientEmail,
      action: 'view',
      timestamp: new Date().toISOString()
    });
    return ok(c, data);
  });
  app.post('/api/public/legacy/:shareId/verify', async (c) => {
    const shareId = c.req.param('shareId');
    const { password } = await c.req.json();
    const inst = new LegacyShareEntity(c.env, shareId);
    if (!(await inst.exists())) return notFound(c);
    const share = await inst.getState();
    // In a real app, we'd hash and compare correctly. Using simple match for MVP.
    if (password !== share.passwordHash) return bad(c, 'Invalid password');
    const journal = new JournalEntity(c.env, share.journalId);
    const journalState = await journal.getState();
    const users = await UserAuthEntity.list(c.env);
    const author = users.items.find(u => u.profile.id === share.userId);
    const data = {
      journalTitle: journalState.title,
      authorName: author?.profile.name || 'Anonymous Author',
      entries: await EntryEntity.listByJournal(c.env, share.journalId, "public"),
      permissions: share.permissions
    };
    return ok(c, data);
  });
  // Public Auth Routes
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
  // Protected Routes
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    return userAuth ? ok(c, userAuth.profile) : notFound(c);
  });
  app.put('/api/auth/settings', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const updatedProfile = { ...userAuth.profile, ...body };
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
    return ok(c, { 
      moodTrends, 
      writingFrequency: Object.entries(frequency).map(([day, count]) => ({ day, count })),
      topTopics: [{ text: 'Reflection', value: 80 }] 
    });
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
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    return ok(c, entries);
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const journalId = c.req.param('id');
    const body = await c.req.json();
    const entry = await EntryEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      userId: payload.userId,
      journalId,
      date: new Date().toISOString()
    });
    return ok(c, entry);
  });
  app.get('/api/notifications', async (c) => {
    const payload = c.get('jwtPayload');
    const notes = await NotificationEntity.listByUser(c.env, payload.userId);
    return ok(c, notes);
  });
}