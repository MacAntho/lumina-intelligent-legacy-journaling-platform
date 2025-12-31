import { create } from 'zustand';
import { api } from './api-client';
import { toast } from 'sonner';
import type { Journal, Entry, User, LegacyContact, InsightData, LoginRequest, RegisterRequest, AuthResponse } from '@shared/types';
interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  journals: Journal[];
  entries: Entry[];
  legacyContacts: LegacyContact[];
  insightData: InsightData | null;
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  fetchEntries: (journalId: string) => Promise<void>;
  addJournal: (journal: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addEntry: (entry: Partial<Entry>) => Promise<void>;
  fetchInsights: () => Promise<void>;
  addLegacyContact: (contact: Partial<LegacyContact>) => Promise<void>;
  removeLegacyContact: (id: string) => Promise<void>;
}
export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('lumina_token'),
  isAuthenticated: !!localStorage.getItem('lumina_token'),
  journals: [],
  entries: [],
  legacyContacts: [],
  insightData: null,
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  initialize: async () => {
    const { token, isLoading, isInitialized } = get();
    if (!token || isLoading || isInitialized) return;
    set({ isLoading: true });
    try {
      const user = await api<User>('/api/auth/me');
      const journals = await api<Journal[]>('/api/journals');
      const contacts = await api<LegacyContact[]>('/api/legacy-contacts');
      set({ 
        user, 
        journals, 
        legacyContacts: contacts, 
        isAuthenticated: true, 
        isLoading: false,
        isInitialized: true 
      });
      get().fetchInsights();
    } catch (error) {
      console.error('Initialization failed:', error);
      get().logout();
      set({ isLoading: false, isInitialized: false });
    }
  },
  login: async (req) => {
    set({ isLoading: true });
    try {
      const res = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      localStorage.setItem('lumina_token', res.token);
      set({ 
        user: res.user, 
        token: res.token, 
        isAuthenticated: true, 
        isLoading: false,
        isInitialized: true 
      });
      toast.success('Welcome back to Lumina');
    } catch (error) {
      console.error('Login failed:', error);
      set({ isLoading: false });
      toast.error('Invalid credentials');
      throw error;
    }
  },
  register: async (req) => {
    set({ isLoading: true });
    try {
      const res = await api<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(req)
      });
      localStorage.setItem('lumina_token', res.token);
      set({ 
        user: res.user, 
        token: res.token, 
        isAuthenticated: true, 
        isLoading: false,
        isInitialized: true 
      });
      toast.success('Sanctuary created');
    } catch (error) {
      console.error('Registration failed:', error);
      set({ isLoading: false });
      toast.error('Registration failed');
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('lumina_token');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      journals: [], 
      entries: [], 
      legacyContacts: [], 
      insightData: null,
      isInitialized: false 
    });
  },
  updateProfile: async (profile) => {
    set({ isSaving: true });
    try {
      const updated = await api<User>('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      set({ user: updated, isSaving: false });
      toast.success('Profile updated');
    } catch (error) {
      console.error('Profile update failed:', error);
      set({ isSaving: false });
      toast.error('Update failed');
    }
  },
  fetchEntries: async (journalId) => {
    try {
      const entries = await api<Entry[]>(`/api/journals/${journalId}/entries`);
      set({ entries });
    } catch (error) {
      console.error('Fetch entries failed:', error);
    }
  },
  addJournal: async (journalData) => {
    set({ isSaving: true });
    try {
      const journal = await api<Journal>('/api/journals', {
        method: 'POST',
        body: JSON.stringify(journalData)
      });
      set(state => ({ journals: [...state.journals, journal], isSaving: false }));
    } catch (error) {
      console.error('Add journal failed:', error);
      set({ isSaving: false });
    }
  },
  deleteJournal: async (id) => {
    try {
      await api(`/api/journals/${id}`, { method: 'DELETE' });
      set(state => ({
        journals: state.journals.filter(j => j.id !== id),
        entries: state.entries.filter(e => e.journalId !== id)
      }));
    } catch (error) {
      console.error('Delete journal failed:', error);
    }
  },
  addEntry: async (entryData) => {
    set({ isSaving: true });
    try {
      const entry = await api<Entry>(`/api/journals/${entryData.journalId}/entries`, {
        method: 'POST',
        body: JSON.stringify(entryData)
      });
      set(state => ({
        entries: [entry, ...state.entries],
        journals: state.journals.map(j => j.id === entry.journalId ? { ...j, lastEntryAt: entry.date } : j),
        isSaving: false
      }));
    } catch (error) {
      console.error('Add entry failed:', error);
      set({ isSaving: false });
    }
  },
  fetchInsights: async () => {
    try {
      const insightData = await api<InsightData>('/api/insights');
      set({ insightData });
    } catch (error) {
      console.error('Fetch insights failed:', error);
    }
  },
  addLegacyContact: async (contactData) => {
    set({ isSaving: true });
    try {
      const contact = await api<LegacyContact>('/api/legacy-contacts', {
        method: 'POST',
        body: JSON.stringify(contactData)
      });
      set(state => ({ legacyContacts: [...state.legacyContacts, contact], isSaving: false }));
    } catch (error) {
      console.error('Add contact failed:', error);
      set({ isSaving: false });
    }
  },
  removeLegacyContact: async (id) => {
    try {
      await api(`/api/legacy-contacts/${id}`, { method: 'DELETE' });
      set(state => ({ legacyContacts: state.legacyContacts.filter(c => c.id !== id) }));
    } catch (error) {
      console.error('Remove contact failed:', error);
    }
  }
}));