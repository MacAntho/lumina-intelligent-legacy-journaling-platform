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
interface AppState {
  user: User | null;
  journals: Journal[];
  entries: Entry[];
  addJournal: (journal: Omit<Journal, 'id' | 'createdAt'>) => void;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (id: string) => void;
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
  addJournal: (journal) => set((state) => ({
    journals: [...state.journals, { ...journal, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
  })),
  addEntry: (entry) => set((state) => ({
    entries: [{ ...entry, id: crypto.randomUUID() }, ...state.entries],
    journals: state.journals.map(j => j.id === entry.journalId ? { ...j, lastEntryAt: entry.date } : j)
  })),
  deleteEntry: (id) => set((state) => ({
    entries: state.entries.filter(e => e.id !== id)
  })),
}));