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
import { ok, bad, notFound } from './core-utils';
import type { LoginRequest, RegisterRequest, DailyContent, User, AnalysisRange, SubscriptionTier } from "@shared/types";
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
  app.use('/api/*', jwt({ secret: JWT_SECRET }));
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const usage = await UsageEntity.getAndReset(c.env, userAuth.profile.id);
    return ok(c, { ...userAuth.profile, usage });
  });
  app.post('/api/stripe/create-checkout', async (c) => {
    const payload = c.get('jwtPayload');
    const { tier } = await c.req.json();
    console.log(`[STRIPE STUB] Creating checkout for user ${payload.userId} to tier ${tier}`);
    return ok(c, { url: `${window.location.origin}/dashboard?stripe_mock=success&tier=${tier}` });
  });
  app.post('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const tier = userAuth?.profile.preferences.tier || 'free';
    const usage = await UsageEntity.getAndReset(c.env, payload.userId);
    if (usage.journalCount >= LIMITS[tier].journals) {
      return c.json({ success: false, error: 'Journal limit reached. Please upgrade to create more sanctuaries.' }, 403);
    }
    const journal = await JournalEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, ...body, createdAt: new Date().toISOString()
    });
    await new UsageEntity(c.env, payload.userId).patch({ journalCount: usage.journalCount + 1 });
    return ok(c, journal);
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    const body = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    const tier = userAuth?.profile.preferences.tier || 'free';
    const usage = await UsageEntity.getAndReset(c.env, payload.userId);
    if (usage.monthlyEntryCount >= LIMITS[tier].entriesPerMonth) {
      return c.json({ success: false, error: 'Monthly entry limit reached. Expand your sanctuary to keep writing.' }, 403);
    }
    const entry = await EntryEntity.create(c.env, {
      id: crypto.randomUUID(), userId: payload.userId, journalId: c.req.param('id'),
      ...body, date: new Date().toISOString()
    });
    await new UsageEntity(c.env, payload.userId).patch({ monthlyEntryCount: usage.monthlyEntryCount + 1 });
    return ok(c, entry);
  });
  app.get('/api/journals/:id/entries', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.listByJournal(c.env, c.req.param('id'), payload.userId));
  });
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
}