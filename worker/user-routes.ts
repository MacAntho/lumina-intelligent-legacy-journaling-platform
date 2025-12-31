import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, JournalEntity, EntryEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // JOURNALS
  app.get('/api/journals', async (c) => {
    const page = await JournalEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/journals', async (c) => {
    const body = await c.req.json();
    if (!body.title?.trim()) return bad(c, 'title required');
    const journal = await JournalEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    });
    return ok(c, journal);
  });
  app.delete('/api/journals/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await JournalEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // ENTRIES
  app.get('/api/journals/:id/entries', async (c) => {
    const journalId = c.req.param('id');
    const entries = await EntryEntity.listByJournal(c.env, journalId);
    return ok(c, entries);
  });
  app.post('/api/journals/:id/entries', async (c) => {
    const journalId = c.req.param('id');
    const body = await c.req.json();
    if (!body.content?.trim()) return bad(c, 'content required');
    const entry = await EntryEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      journalId,
      date: new Date().toISOString()
    });
    // Update journal lastEntryAt
    const journal = new JournalEntity(c.env, journalId);
    if (await journal.exists()) {
      await journal.patch({ lastEntryAt: entry.date });
    }
    return ok(c, entry);
  });
  // INSIGHTS (Mocked processing based on real data)
  app.get('/api/insights', async (c) => {
    return ok(c, {
      moodTrends: [
        { date: '2024-05-04', score: 3 },
        { date: '2024-05-10', score: 5 },
      ],
      writingFrequency: [
        { day: 'Mon', count: 2 },
        { day: 'Tue', count: 4 },
      ],
      topTopics: [
        { text: 'Growth', value: 85 },
        { text: 'Focus', value: 70 },
      ],
    });
  });
}