import { create } from 'zustand';
import { api } from './api-client';
import type { Journal, Entry, User, LegacyContact, InsightData } from '@shared/types';
interface AppState {
  user: User | null;
  journals: Journal[];
  entries: Entry[];
  legacyContacts: LegacyContact[];
  insightData: InsightData | null;
  isLoading: boolean;
  isSaving: boolean;
  initialize: () => Promise<void>;
  fetchEntries: (journalId: string) => Promise<void>;
  addJournal: (journal: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addEntry: (entry: Partial<Entry>) => Promise<void>;
  fetchInsights: () => Promise<void>;
  addLegacyContact: (contact: Partial<LegacyContact>) => Promise<void>;
  removeLegacyContact: (id: string) => Promise<void>;
}
export const useAppStore = create<AppState>((set, get) => ({
  user: { id: 'u1', name: 'Julian Stone', email: 'julian@lumina.io' },
  journals: [],
  entries: [],
  legacyContacts: [],
  insightData: null,
  isLoading: false,
  isSaving: false,
  initialize: async () => {
    set({ isLoading: true });
    try {
      const [journals, contacts] = await Promise.all([
        api<Journal[]>('/api/journals'),
        api<LegacyContact[]>('/api/legacy-contacts')
      ]);
      set({ journals, legacyContacts: contacts, isLoading: false });
      // Background load insights
      get().fetchInsights();
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({ isLoading: false });
    }
  },
  fetchEntries: async (journalId: string) => {
    try {
      const entries = await api<Entry[]>(`/api/journals/${journalId}/entries`);
      set({ entries });
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  },
  addJournal: async (journalData) => {
    set({ isSaving: true });
    try {
      const newJournal = await api<Journal>('/api/journals', {
        method: 'POST',
        body: JSON.stringify(journalData),
      });
      set((state) => ({
        journals: [...state.journals, newJournal],
        isSaving: false
      }));
    } catch (error) {
      console.error('Failed to add journal:', error);
      set({ isSaving: false });
    }
  },
  deleteJournal: async (id) => {
    try {
      await api(`/api/journals/${id}`, { method: 'DELETE' });
      set((state) => ({
        journals: state.journals.filter(j => j.id !== id),
        entries: state.entries.filter(e => e.journalId !== id)
      }));
    } catch (error) {
      console.error('Failed to delete journal:', error);
    }
  },
  addEntry: async (entryData) => {
    set({ isSaving: true });
    try {
      const entry = await api<Entry>(`/api/journals/${entryData.journalId}/entries`, {
        method: 'POST',
        body: JSON.stringify(entryData),
      });
      set((state) => ({
        entries: [entry, ...state.entries],
        journals: state.journals.map(j =>
          j.id === entry.journalId ? { ...j, lastEntryAt: entry.date } : j
        ),
        isSaving: false
      }));
    } catch (error) {
      console.error('Failed to add entry:', error);
      set({ isSaving: false });
    }
  },
  fetchInsights: async () => {
    try {
      const insightData = await api<InsightData>('/api/insights');
      set({ insightData });
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  },
  addLegacyContact: async (contactData) => {
    set({ isSaving: true });
    try {
      const contact = await api<LegacyContact>('/api/legacy-contacts', {
        method: 'POST',
        body: JSON.stringify(contactData),
      });
      set((state) => ({
        legacyContacts: [...state.legacyContacts, contact],
        isSaving: false
      }));
    } catch (error) {
      console.error('Failed to add contact:', error);
      set({ isSaving: false });
    }
  },
  removeLegacyContact: async (id) => {
    try {
      await api(`/api/legacy-contacts/${id}`, { method: 'DELETE' });
      set((state) => ({
        legacyContacts: state.legacyContacts.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Failed to remove contact:', error);
    }
  },
}));