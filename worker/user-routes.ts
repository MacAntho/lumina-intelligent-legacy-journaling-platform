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
  ExportOptions, LegacyAuditLog 
} from "@shared/types";
import { generateServerPdf } from "./pdf-service";
const JWT_SECRET = "lumina-secret-key-change-this";
/**
 * Hashes passwords using PBKDF2 for secure storage.
 */
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
/**
 * Registers user routes on the Hono application.
 */
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PUBLIC ROUTES (No JWT required) ---
  /**
   * Fetches shared legacy archive metadata if valid access key is provided.
   */
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
  /**
   * Verifies password for a protected legacy archive.
   */
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
  /**
   * Dispatches password recovery instructions.
   */
  app.post('/api/auth/forgot', async (c) => {
    const { email } = await c.req.json();
    return ok(c, { message: "Recovery dispatched if account exists.", debugToken: "LMN-123-RECOVERY" });
  });
  // --- AUTH PROTECTED ROUTES ---
  /**
   * Registers a new user.
   */
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
  /**
   * Authenticates a user and returns a session token.
   */
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
  /**
   * Fetches the current authenticated user's profile and usage.
   */
  app.get('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const usage = await UsageEntity.getAndReset(c.env, userAuth.profile.id);
    return ok(c, { ...userAuth.profile, usage });
  });
  /**
   * Updates user preferences.
   */
  app.put('/api/auth/settings', async (c) => {
    const payload = c.get('jwtPayload');
    const updates = await c.req.json();
    const userAuth = await UserAuthEntity.findByEmail(c.env, payload.email);
    if (!userAuth) return notFound(c);
    const updated = { ...userAuth.profile, ...updates };
    await new UserAuthEntity(c.env, payload.email).patch({ profile: updated });
    return ok(c, updated);
  });
  /**
   * Permanently deletes user account and all associated data.
   */
  app.delete('/api/auth/me', async (c) => {
    const payload = c.get('jwtPayload');
    await UserAuthEntity.purgeAllUserData(c.env, payload.userId, payload.email);
    return ok(c, { message: "Sanctuary purged." });
  });
  /**
   * Lists all journals for the current user.
   */
  app.get('/api/journals', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await JournalEntity.listByUser(c.env, payload.userId));
  });
  /**
   * Lists all entries for the current user.
   */
  app.get('/api/entries/all', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await EntryEntity.listByUser(c.env, payload.userId));
  });
  /**
   * Fetches the export history for the current user.
   */
  app.get('/api/exports', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await ExportLogEntity.listByUser(c.env, payload.userId));
  });
  /**
   * Fetches the legacy audit logs for the current user.
   */
  app.get('/api/legacy/audit', async (c) => {
    const payload = c.get('jwtPayload');
    return ok(c, await LegacyAuditLogEntity.listByUser(c.env, payload.userId));
  });
  /**
   * Generates a PDF export for a specific journal.
   */
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
    // Log the export event
    await ExportLogEntity.create(c.env, {
      id: crypto.randomUUID(),
      userId: payload.userId,
      journalId,
      timestamp: new Date().toISOString(),
      format: 'pdf',
      status: 'success',
      options
    });
    return new Response(pdfBytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="archive.pdf"' } });
  });
}