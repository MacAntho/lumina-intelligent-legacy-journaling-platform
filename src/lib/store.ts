import { create } from 'zustand';
import { api } from './api-client';
import { toast } from 'sonner';
import type {
  Journal, Entry, User, LegacyContact, InsightData, SavedSearch,
  LoginRequest, RegisterRequest, AuthResponse, AiMessage,
  DailyContent, ExportLog, LegacyAuditLog, AppNotification
} from '@shared/types';
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  journals: Journal[];
  entries: Entry[];
  drafts: Record<string, Partial<Entry>>;
  legacyContacts: LegacyContact[];
  legacyAuditLogs: LegacyAuditLog[];
  insightData: InsightData | null;
  aiChatHistory: AiMessage[];
  dailyContent: DailyContent | null;
  exportHistory: ExportLog[];
  notifications: AppNotification[];
  unreadCount: number;
  recentSearches: string[];
  savedSearches: SavedSearch[];
  searchSuggestions: { titles: string[], tags: string[] };
  isLoading: boolean;
  isSaving: boolean;
  isInitialized: boolean;
  isTourActive: boolean;
  tourStep: number;
  initialize: () => Promise<void>;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; debugToken?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  heartbeat: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  fetchEntries: (journalId: string, params?: string) => Promise<void>;
  addJournal: (journal: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addEntry: (entry: Partial<Entry>) => Promise<void>;
  setDraft: (journalId: string, draft: Partial<Entry>) => void;
  clearDraft: (journalId: string) => void;
  fetchInsights: () => Promise<void>;
  fetchSearchSuggestions: () => Promise<void>;
  addLegacyContact: (contact: Partial<LegacyContact>) => Promise<void>;
  removeLegacyContact: (id: string) => Promise<void>;
  fetchLegacyAuditLogs: () => Promise<void>;
  fetchDailyContent: () => Promise<void>;
  logExport: (log: Partial<ExportLog>) => Promise<void>;
  fetchExportHistory: () => Promise<void>;
  sendAiMessage: (content: string) => Promise<void>;
  clearChatHistory: () => void;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  fetchSavedSearches: () => Promise<void>;
  saveSearch: (search: Partial<SavedSearch>) => Promise<void>;
  deleteSavedSearch: (id: string) => Promise<void>;
  startTour: () => void;
  nextTourStep: () => void;
  skipTour: () => Promise<void>;
  restartTour: () => Promise<void>;
}
export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('lumina_token'),
  isAuthenticated: !!localStorage.getItem('lumina_token'),
  journals: [],
  entries: [],
  drafts: JSON.parse(localStorage.getItem('lumina_drafts') || '{}'),
  legacyContacts: [],
  legacyAuditLogs: [],
  insightData: null,
  aiChatHistory: JSON.parse(localStorage.getItem('lumina_chat') || '[]'),
  dailyContent: null,
  exportHistory: [],
  notifications: [],
  unreadCount: 0,
  recentSearches: JSON.parse(localStorage.getItem('lumina_recent_searches') || '[]'),
  savedSearches: [],
  searchSuggestions: { titles: [], tags: [] },
  isLoading: false,
  isSaving: false,
  isInitialized: false,
  isTourActive: false,
  tourStep: 0,
  initialize: async () => {
    const token = get().token;
    if (!token || get().isInitialized) return;
    set({ isLoading: true });
    try {
      const user = await api<User>('/api/auth/me');
      const journals = await api<Journal[]>('/api/journals');
      const contacts = await api<LegacyContact[]>('/api/legacy-contacts');
      const entries = await api<Entry[]>('/api/entries/all').catch(() => []);
      set({
        user,
        journals,
        entries,
        legacyContacts: contacts,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        isTourActive: !user.preferences?.onboardingCompleted
      });
      // Background data loading
      get().fetchInsights().catch(e => console.error("Insights fetch failed", e));
      get().fetchDailyContent().catch(e => console.error("Daily content fetch failed", e));
      get().fetchNotifications().catch(e => console.error("Notifications fetch failed", e));
      get().fetchSavedSearches().catch(e => console.error("Saved searches fetch failed", e));
      get().fetchSearchSuggestions().catch(e => console.error("Search suggestions fetch failed", e));
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => get().heartbeat(), 300000);
    } catch (error) {
      console.error("[INIT ERROR]", error);
      get().logout();
      set({ isLoading: false, isInitialized: false });
    }
  },
  heartbeat: async () => {
    if (!get().isAuthenticated) return;
    try {
      const user = await api<User>('/api/auth/heartbeat', { method: 'PUT', silent: true });
      set({ user });
      get().fetchNotifications();
    } catch (e) {
      console.warn("Heartbeat missed", e);
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
        isInitialized: true,
        isTourActive: !res.user.preferences?.onboardingCompleted
      });
      toast.success('Sanctuary Unlocked');
      get().initialize();
    } catch (error) {
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
        isInitialized: true,
        isTourActive: true
      });
      toast.success('Your digital legacy has begun.');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Could not create sanctuary');
      throw error;
    }
  },
  updateProfile: async (profileUpdates) => {
    set({ isSaving: true });
    const currentUser = get().user;
    try {
      const payload = { ...profileUpdates };
      if (profileUpdates.preferences && currentUser) {
        payload.preferences = {
          ...currentUser.preferences,
          ...profileUpdates.preferences
        };
      }
      const updated = await api<User>('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      set({ user: updated, isSaving: false });
      toast.success('Preferences synchronized');
    } catch (error) {
      set({ isSaving: false });
      toast.error('Synchronization failed');
      console.error(error);
    }
  },
  fetchEntries: async (journalId, params = '') => {
    try {
      const url = `/api/journals/${journalId}/entries${params ? `?${params}` : ''}`;
      const entries = await api<Entry[]>(url);
      set({ entries });
    } catch (error) {
      console.error("Fetch entries failed", error);
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
      toast.success('New sanctuary initialized');
    } catch (error) {
      set({ isSaving: false });
      console.error(error);
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
      console.error("Delete journal failed", error);
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
      set({ isSaving: false });
      console.error(error);
    }
  },
  logout: () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    localStorage.removeItem('lumina_token');
    localStorage.removeItem('lumina_chat');
    localStorage.removeItem('lumina_drafts');
    localStorage.removeItem('lumina_recent_searches');
    set({
      user: null, token: null, isAuthenticated: false, journals: [], entries: [],
      legacyContacts: [], legacyAuditLogs: [], insightData: null, aiChatHistory: [],
      dailyContent: null, notifications: [], unreadCount: 0, recentSearches: [],
      savedSearches: [], isInitialized: false, isLoading: false, isTourActive: false, tourStep: 0
    });
  },
  forgotPassword: async (email) => api('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: async (token, password) => api('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  deleteAccount: async () => { set({ isSaving: true }); try { await api('/api/auth/me', { method: 'DELETE' }); get().logout(); toast.success('Sanctuary purged.'); } catch (e) { set({ isSaving: false }); console.error(e); } },
  setDraft: (journalId, draft) => { const next = { ...get().drafts, [journalId]: draft }; set({ drafts: next }); localStorage.setItem('lumina_drafts', JSON.stringify(next)); },
  clearDraft: (journalId) => { const { [journalId]: _, ...rest } = get().drafts; set({ drafts: rest }); localStorage.setItem('lumina_drafts', JSON.stringify(rest)); },
  fetchInsights: async () => { try { const data = await api<InsightData>('/api/insights'); set({ insightData: data }); } catch (e) { console.error(e); } },
  fetchSearchSuggestions: async () => { try { const data = await api<{ titles: string[], tags: string[] }>('/api/search/suggestions'); set({ searchSuggestions: data }); } catch (e) { console.error(e); } },
  addLegacyContact: async (data) => { try { const c = await api<LegacyContact>('/api/legacy-contacts', { method: 'POST', body: JSON.stringify(data) }); set(s => ({ legacyContacts: [...s.legacyContacts, c] })); } catch (e) { console.error(e); } },
  removeLegacyContact: async (id) => { try { await api(`/api/legacy-contacts/${id}`, { method: 'DELETE' }); set(s => ({ legacyContacts: s.legacyContacts.filter(c => c.id !== id) })); } catch (e) { console.error(e); } },
  fetchLegacyAuditLogs: async () => { try { const logs = await api<LegacyAuditLog[]>('/api/legacy/audit'); set({ legacyAuditLogs: logs }); } catch (e) { console.error(e); } },
  fetchDailyContent: async () => { try { const data = await api<DailyContent>('/api/ai/daily'); set({ dailyContent: data }); } catch (e) { console.error(e); } },
  logExport: async (data) => { try { const log = await api<ExportLog>('/api/exports', { method: 'POST', body: JSON.stringify(data) }); set(s => ({ exportHistory: [log, ...s.exportHistory] })); } catch (e) { console.error(e); } },
  fetchExportHistory: async () => { try { const logs = await api<ExportLog[]>('/api/exports'); set({ exportHistory: logs }); } catch (e) { console.error(e); } },
  sendAiMessage: async (content) => {
    const userMsg: AiMessage = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date().toISOString() };
    const newHistory = [...get().aiChatHistory, userMsg];
    set({ aiChatHistory: newHistory, isSaving: true });
    try {
      // Simulation of AI processing
      await new Promise(r => setTimeout(r, 1500));
      const botMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I've analyzed your request regarding "${content.slice(0, 20)}...". Looking at your recent reflections, I notice a pattern of growth in your ${get().journals[0]?.title || 'journals'}. How does that align with your current goals?`,
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [...newHistory, botMsg];
      set({ aiChatHistory: updatedHistory, isSaving: false });
      localStorage.setItem('lumina_chat', JSON.stringify(updatedHistory));
    } catch (e) {
      set({ isSaving: false });
      console.error(e);
      toast.error("AI Assistant is offline");
    }
  },
  clearChatHistory: () => { localStorage.removeItem('lumina_chat'); set({ aiChatHistory: [] }); },
  fetchNotifications: async () => { try { const notes = await api<AppNotification[]>('/api/notifications'); set({ notifications: notes, unreadCount: notes.filter(n => !n.isRead).length }); } catch (e) { console.error(e); } },
  markNotificationRead: async (id) => { set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n), unreadCount: Math.max(0, s.unreadCount - 1) })); try { await api(`/api/notifications/${id}/read`, { method: 'PATCH' }); } catch (e) { console.error(e); } },
  markAllNotificationsRead: async () => { set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })), unreadCount: 0 })); try { await api('/api/notifications/read-all', { method: 'POST' }); } catch (e) { console.error(e); } },
  deleteNotification: async (id) => { set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })); try { await api(`/api/notifications/${id}`, { method: 'DELETE' }); } catch (e) { console.error(e); } },
  addRecentSearch: (query) => { if (!query.trim()) return; const next = [query, ...get().recentSearches.filter(q => q !== query)].slice(0, 5); set({ recentSearches: next }); localStorage.setItem('lumina_recent_searches', JSON.stringify(next)); },
  clearRecentSearches: () => { set({ recentSearches: [] }); localStorage.setItem('lumina_recent_searches', JSON.stringify([])); },
  fetchSavedSearches: async () => { try { const data = await api<SavedSearch[]>('/api/searches'); set({ savedSearches: data }); } catch (e) { console.error(e); } },
  saveSearch: async (data) => { try { const s = await api<SavedSearch>('/api/searches', { method: 'POST', body: JSON.stringify(data) }); set(st => ({ savedSearches: [s, ...st.savedSearches] })); } catch (e) { console.error(e); } },
  deleteSavedSearch: async (id) => { try { await api(`/api/searches/${id}`, { method: 'DELETE' }); set(s => ({ savedSearches: s.savedSearches.filter(st => st.id !== id) })); } catch (e) { console.error(e); } },
  startTour: () => set({ isTourActive: true, tourStep: 0 }),
  nextTourStep: () => set(state => ({ tourStep: state.tourStep + 1 })),
  skipTour: async () => { 
    set({ isTourActive: false, tourStep: 0 }); 
    await get().updateProfile({ preferences: { onboardingCompleted: true } as any }); 
  },
  restartTour: async () => { 
    set({ isTourActive: true, tourStep: 0 }); 
    await get().updateProfile({ preferences: { onboardingCompleted: false } as any }); 
  }
}));