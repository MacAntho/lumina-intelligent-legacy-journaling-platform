import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { format } from "date-fns";
import type { Env } from './core-utils';
import { UserAuthEntity, JournalEntity, EntryEntity, LegacyContactEntity, LegacyShareEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { LoginRequest, RegisterRequest } from "@shared/types";
const JWT_SECRET = "lumina-secret-key-change-this";
async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
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
        preferences: { theme: 'system', notificationsEnabled: true, language: 'en' },
        createdAt: new Date().toISOString()
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
    const token = await sign({ userId: userAuth.profile.id, email: userAuth.id, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
    return ok(c, { user: userAuth.profile, token });
  });
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
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
    const entries = await EntryEntity.listByJournal(c.env, journalId, payload.userId);
    let filtered = entries;
    if (q) filtered = filtered.filter(e => e.content.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q));
    if (tag) filtered = filtered.filter(e => e.tags.includes(tag));
    return ok(c, filtered);
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const entry = await EntryEntity.create(c.env, {
      ...body,
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
      e.tags?.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    const topTopics = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([text, count]) => ({
        text,
        value: Math.round((count / Math.max(1, entries.length)) * 100)
      }));
    if (topTopics.length === 0) {
      topTopics.push({ text: 'Discovery', value: 100 });
    }
    return ok(c, {
      moodTrends,
      writingFrequency: Object.entries(frequency).map(([day, count]) => ({ day, count })),
      topTopics
    });
  });
  app.get('/api/ai/daily', async (c) => {
    const payload = c.get('jwtPayload');
    const journals = await JournalEntity.listByUser(c.env, payload.userId);
    const lastJournal = journals[0];
    let prompt = "How did you find stillness today?";
    let affirmation = "I am growing through my reflections.";
    if (lastJournal?.templateId === 'fitness') {
      prompt = "Reflect on how your body feels after today's movement. What did it teach you about your limits?";
      affirmation = "My body is a capable vessel for my spirit.";
    } else if (lastJournal?.templateId === 'gratitude') {
      prompt = "What's one thing that happened today that you didn't expect, but are thankful for?";
      affirmation = "I see beauty in the unexpected small moments.";
    }
    return ok(c, { prompt, affirmation, targetJournalId: lastJournal?.id });
  });
  app.post('/api/ai/chat', async (c) => {
    const payload = c.get('jwtPayload');
    const { message } = await c.req.json();
    const entries = await EntryEntity.listByUser(c.env, payload.userId);
    let responseContent = "I'm listening. Your journey is uniquely yours, and I'm here to help you navigate it.";
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('summary') || lowerMsg.includes('week')) {
      responseContent = `Based on your ${entries.length} entries, you've shown consistent growth. Recently, you've focused on ${entries.slice(0, 3).map(e => e.tags[0]).filter(Boolean).join(', ') || 'personal discovery'}.`;
    } else if (lowerMsg.includes('mood') || lowerMsg.includes('feel')) {
      const moodAvg = entries.slice(0, 5).reduce((acc, e) => acc + (Number(e.mood) || 3), 0) / 5;
      responseContent = `Your recent entries suggest a ${moodAvg > 3.5 ? 'positive' : 'reflective'} trend. You tend to feel more inspired after journaling in the mornings.`;
    } else if (lowerMsg.includes('theme') || lowerMsg.includes('topic')) {
      responseContent = "I've noticed recurring themes of resilience and gratitude in your writing. You often mention 'Balance' when you're feeling most grounded.";
    }
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString()
    };
    return ok(c, assistantMsg);
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
    const { journalId, recipientEmail } = await c.req.json();
    const shareId = crypto.randomUUID();
    const accessKey = Math.random().toString(36).slice(-8);
    const share = await LegacyShareEntity.create(c.env, {
      id: shareId,
      journalId,
      userId: payload.userId,
      recipientEmail,
      accessKey,
      createdAt: new Date().toISOString()
    });
    return ok(c, share);
  });
  app.get('/api/public/legacy/:shareId', async (c) => {
    const shareId = c.req.param('shareId');
    const key = c.req.query('key');
    const shareInst = new LegacyShareEntity(c.env, shareId);
    if (!(await shareInst.exists())) return notFound(c, 'Legacy archive not found');
    const share = await shareInst.getState();
    if (share.accessKey !== key) return bad(c, 'Invalid access key');
    const journal = await new JournalEntity(c.env, share.journalId).getState();
    const entries = await EntryEntity.listByJournal(c.env, share.journalId, share.userId);
    return ok(c, {
      journalTitle: journal.title,
      authorName: "A Lumina Resident",
      entries: entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    });
  });
}