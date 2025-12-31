import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, JournalEntity, EntryEntity, LegacyContactEntity } from "./entities";
import { ok, bad } from './core-utils';
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
    const journal = new JournalEntity(c.env, journalId);
    if (await journal.exists()) {
      await journal.patch({ lastEntryAt: entry.date });
    }
    return ok(c, entry);
  });
  // LEGACY CONTACTS
  app.get('/api/legacy-contacts', async (c) => {
    const page = await LegacyContactEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/legacy-contacts', async (c) => {
    const body = await c.req.json();
    if (!body.email?.trim() || !body.name?.trim()) return bad(c, 'name and email required');
    const contact = await LegacyContactEntity.create(c.env, {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      status: 'pending'
    });
    return ok(c, contact);
  });
  app.delete('/api/legacy-contacts/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await LegacyContactEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // INSIGHTS
  app.get('/api/insights', async (c) => {
    const entriesPage = await EntryEntity.list(c.env, null, 1000);
    const entries = entriesPage.items;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const frequencyMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    entries.forEach(e => {
      const day = days[new Date(e.date).getUTCDay()];
      frequencyMap[day]++;
    });
    const writingFrequency = days.map(day => ({ day, count: frequencyMap[day] }));
    return ok(c, {
      moodTrends: [
        { date: '2024-05-01', score: 3 },
        { date: '2024-05-04', score: 4 },
        { date: '2024-05-08', score: 2 },
        { date: '2024-05-12', score: 5 },
      ],
      writingFrequency,
      topTopics: [
        { text: 'Self-Growth', value: 85 },
        { text: 'Productivity', value: 70 },
        { text: 'Health', value: 45 },
        { text: 'Family', value: 30 },
      ],
    });
  });
}