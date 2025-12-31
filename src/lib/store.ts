import { create } from 'zustand';
import { api } from './api-client';
import { toast } from 'sonner';
import type { Journal, Entry, User, LegacyContact, InsightData, LoginRequest, RegisterRequest, AuthResponse, AiMessage, DailyContent, ExportLog } from '@shared/types';
interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  journals: Journal[];
  entries: Entry[];
  drafts: Record<string, Partial<Entry>>;
  legacyContacts: LegacyContact[];
  insightData: InsightData | null;
  aiChatHistory: AiMessage[];
  dailyContent: DailyContent | null;
  exportHistory: ExportLog[];
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  fetchEntries: (journalId: string, params?: string) => Promise<void>;
  addJournal: (journal: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addEntry: (entry: Partial<Entry>) => Promise<void>;
  setDraft: (journalId: string, draft: Partial<Entry>) => void;
  clearDraft: (journalId: string) => void;
  fetchInsights: () => Promise<void>;
  addLegacyContact: (contact: Partial<LegacyContact>) => Promise<void>;
  removeLegacyContact: (id: string) => Promise<void>;
  fetchDailyContent: () => Promise<void>;
  logExport: (log: Partial<ExportLog>) => Promise<void>;
  fetchExportHistory: () => Promise<void>;
  sendAiMessage: (content: string) => Promise<void>;
  clearChatHistory: () => void;
}
export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('lumina_token'),
  isAuthenticated: !!localStorage.getItem('lumina_token'),
  journals: [],
  entries: [],
  drafts: JSON.parse(localStorage.getItem('lumina_drafts') || '{}'),
  legacyContacts: [],
  insightData: null,
  aiChatHistory: JSON.parse(localStorage.getItem('lumina_chat') || '[]'),
  dailyContent: null,
  exportHistory: [],
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  initialize: async () => {
    const token = get().token;
    const isLoading = get().isLoading;
    const isInitialized = get().isInitialized;
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
      get().fetchDailyContent();
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
    localStorage.removeItem('lumina_chat');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      journals: [],
      entries: [],
      legacyContacts: [],
      insightData: null,
      aiChatHistory: [],
      dailyContent: null,
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
  fetchEntries: async (journalId, params = '') => {
    try {
      const url = `/api/journals/${journalId}/entries${params ? `?${params}` : ''}`;
      const entries = await api<Entry[]>(url);
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
      get().clearDraft(entry.journalId);
    } catch (error) {
      console.error('Add entry failed:', error);
      set({ isSaving: false });
    }
  },
  setDraft: (journalId, draft) => {
    const currentDrafts = get().drafts;
    const nextDrafts = { ...currentDrafts, [journalId]: draft };
    set({ drafts: nextDrafts });
    localStorage.setItem('lumina_drafts', JSON.stringify(nextDrafts));
  },
  clearDraft: (journalId) => {
    const currentDrafts = get().drafts;
    const { [journalId]: _, ...rest } = currentDrafts;
    set({ drafts: rest });
    localStorage.setItem('lumina_drafts', JSON.stringify(rest));
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
  },
  fetchDailyContent: async () => {
    try {
      const dailyContent = await api<DailyContent>('/api/ai/daily');
      set({ dailyContent });
    } catch (error) {
      console.error('Fetch daily content failed:', error);
    }
  },
  logExport: async (logData) => {
    try {
      const log = await api<ExportLog>('/api/exports', { method: 'POST', body: JSON.stringify(logData) });
      set(state => ({ exportHistory: [log, ...state.exportHistory] }));
    } catch (e) { console.error('Log export failed', e); }
  },
  fetchExportHistory: async () => {
    try {
      const logs = await api<ExportLog[]>('/api/exports');
      set({ exportHistory: logs });
    } catch (e) { console.error('Fetch export history failed', e); }
  },
  sendAiMessage: async (content) => {
    const userMsg: AiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    set(state => {
      const newHistory = [...state.aiChatHistory, userMsg];
      localStorage.setItem('lumina_chat', JSON.stringify(newHistory));
      return { aiChatHistory: newHistory, isSaving: true };
    });
    try {
      const response = await api<AiMessage>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: content, history: get().aiChatHistory })
      });
      set(state => {
        const newHistory = [...state.aiChatHistory, response];
        localStorage.setItem('lumina_chat', JSON.stringify(newHistory));
        return { aiChatHistory: newHistory, isSaving: false };
      });
    } catch (error) {
      console.error('AI chat failed:', error);
      set({ isSaving: false });
      toast.error('AI connection lost');
    }
  },
  clearChatHistory: () => {
    localStorage.removeItem('lumina_chat');
    set({ aiChatHistory: [] });
  }
}));