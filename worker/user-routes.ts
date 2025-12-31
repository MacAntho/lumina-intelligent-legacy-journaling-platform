import { Hono } from "hono";
import { jwt, sign, verify } from "hono/jwt";
import type { Env } from './core-utils';
import { UserAuthEntity, JournalEntity, EntryEntity, LegacyContactEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { LoginRequest, RegisterRequest } from "@shared/types";
const JWT_SECRET = "lumina-secret-key-change-this";
// Simple PBKDF2 Hashing (SubtleCrypto)
async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // PUBLIC AUTH
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
      salt: salt,
      profile: {
        id: userId,
        name: body.name,
        email: body.email.toLowerCase(),
        preferences: { theme: 'system', notificationsEnabled: true },
        createdAt: new Date().toISOString()
      }
    });
    const token = await sign({ userId: userId, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, JWT_SECRET);
    return ok(c, { user: userAuth.profile, token });
  });
  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json<LoginRequest>();
    const userAuth = await UserAuthEntity.findByEmail(c.env, body.email);
    if (!userAuth) return bad(c, 'Invalid credentials');
    const hash = await hashPassword(body.password, userAuth.salt);
    if (hash !== userAuth.passwordHash) return bad(c, 'Invalid credentials');
    const token = await sign({ userId: userAuth.profile.id, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, JWT_SECRET);
    return ok(c, { user: userAuth.profile, token });
  });
  // PROTECTED ROUTES MIDDLEWARE
  app.use('/api/journals/*', jwt({ secret: JWT_SECRET }));
  app.use('/api/legacy-contacts/*', jwt({ secret: JWT_SECRET }));
  app.use('/api/insights', jwt({ secret: JWT_SECRET }));
  app.use('/api/auth/me', jwt({ secret: JWT_SECRET }));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c, 'User not found');
    return ok(c, userAuth.profile);
  });
  app.put('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const authInst = new UserAuthEntity(c.env, payload.email);
    const data = await authInst.getState();
    const updatedProfile = { ...data.profile, ...body };
    await authInst.patch({ profile: updatedProfile });
    return ok(c, updatedProfile);
  });
  // SCOPED DATA ROUTES
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const journals = await JournalEntity.listByUser(c.env, payload.userId);
    return ok(c, journals);
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
    const journal = new JournalEntity(c.env, journalId);
    if (await journal.exists()) {
      await journal.patch({ lastEntryAt: entry.date });
    }
    return ok(c, entry);
  });
  app.get('/api/legacy-contacts', async (c) => {
    const payload = c.get('jwtPayload');
    const contacts = await LegacyContactEntity.listByUser(c.env, payload.userId);
    return ok(c, contacts);
  });
  app.get('/api/insights', async (c) => {
    const payload = c.get('jwtPayload');
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const frequencyMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    entries.forEach(e => {
      const day = days[new Date(e.date).getUTCDay()];
      frequencyMap[day]++;
    });
    return ok(c, {
      moodTrends: [
        { date: '2024-05-01', score: 3 },
        { date: '2024-05-12', score: 5 },
      ],
      writingFrequency: days.map(day => ({ day, count: frequencyMap[day] })),
      topTopics: [
        { text: 'Self-Growth', value: 85 },
        { text: 'Productivity', value: 70 },
      ],
    });
  });
}