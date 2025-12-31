import { create } from 'zustand';
export interface Entry {
  id: string;
  journalId: string;
  content: string;
  date: string;
  mood?: string;
}
export interface Journal {
  id: string;
  title: string;
  description: string;
  type: 'reflective' | 'fitness' | 'gratitude' | 'legacy';
  createdAt: string;
  lastEntryAt?: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface LegacyContact {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'verified';
}
export interface InsightData {
  moodTrends: { date: string; score: number }[];
  writingFrequency: { day: string; count: number }[];
  topTopics: { text: string; value: number }[];
}
interface AppState {
  user: User | null;
  journals: Journal[];
  entries: Entry[];
  legacyContacts: LegacyContact[];
  insightData: InsightData;
  addJournal: (journal: Omit<Journal, 'id' | 'createdAt'>) => void;
  deleteJournal: (id: string) => void;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (id: string) => void;
  addLegacyContact: (contact: Omit<LegacyContact, 'id' | 'status'>) => void;
  removeLegacyContact: (id: string) => void;
}
export const useAppStore = create<AppState>((set) => ({
  user: { id: 'u1', name: 'Julian Stone', email: 'julian@lumina.io' },
  journals: [
    {
      id: 'j1',
      title: 'Daily Reflection',
      description: 'Morning and evening thoughts.',
      type: 'reflective',
      createdAt: '2024-01-01',
      lastEntryAt: '2024-05-10',
    },
    {
      id: 'j2',
      title: 'Fitness Journey',
      description: 'Progress and mental state during training.',
      type: 'fitness',
      createdAt: '2024-02-15',
      lastEntryAt: '2024-05-08',
    },
    {
      id: 'j3',
      title: 'Legacy Letter',
      description: 'Messages for the future.',
      type: 'legacy',
      createdAt: '2024-03-20',
      lastEntryAt: '2024-04-12',
    },
  ],
  entries: [
    {
      id: 'e1',
      journalId: 'j1',
      content: 'Today was a breakthrough in my creative process. The morning silence really helps.',
      date: '2024-05-10T09:00:00Z',
      mood: 'Inspired',
    },
    {
      id: 'e2',
      journalId: 'j1',
      content: 'Feeling a bit drained after the long meeting, but grateful for the team.',
      date: '2024-05-09T20:00:00Z',
      mood: 'Tired',
    },
  ],
  legacyContacts: [
    { id: 'lc1', name: 'Elena Stone', email: 'elena@example.com', status: 'verified' },
  ],
  insightData: {
    moodTrends: [
      { date: '2024-05-04', score: 3 },
      { date: '2024-05-05', score: 4 },
      { date: '2024-05-06', score: 2 },
      { date: '2024-05-07', score: 5 },
      { date: '2024-05-08', score: 4 },
      { date: '2024-05-09', score: 3 },
      { date: '2024-05-10', score: 5 },
    ],
    writingFrequency: [
      { day: 'Mon', count: 2 },
      { day: 'Tue', count: 1 },
      { day: 'Wed', count: 3 },
      { day: 'Thu', count: 2 },
      { day: 'Fri', count: 4 },
      { day: 'Sat', count: 1 },
      { day: 'Sun', count: 0 },
    ],
    topTopics: [
      { text: 'Growth', value: 80 },
      { text: 'Family', value: 65 },
      { text: 'Focus', value: 90 },
      { text: 'Health', value: 45 },
      { text: 'Work', value: 70 },
    ],
  },
  addJournal: (journal) => set((state) => ({
    journals: [...state.journals, { ...journal, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
  })),
  deleteJournal: (id) => set((state) => ({
    journals: state.journals.filter(j => j.id !== id),
    entries: state.entries.filter(e => e.journalId !== id)
  })),
  addEntry: (entry) => set((state) => ({
    entries: [{ ...entry, id: crypto.randomUUID() }, ...state.entries],
    journals: state.journals.map(j => j.id === entry.journalId ? { ...j, lastEntryAt: entry.date } : j)
  })),
  deleteEntry: (id) => set((state) => ({
    entries: state.entries.filter(e => e.id !== id)
  })),
  addLegacyContact: (contact) => set((state) => ({
    legacyContacts: [...state.legacyContacts, { ...contact, id: crypto.randomUUID(), status: 'pending' }]
  })),
  removeLegacyContact: (id) => set((state) => ({
    legacyContacts: state.legacyContacts.filter(c => c.id !== id)
  })),
}));