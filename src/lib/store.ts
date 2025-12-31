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
      set({
        user,
        journals,
        legacyContacts: contacts,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        isTourActive: !user.preferences?.onboardingCompleted
      });
      get().fetchInsights();
      get().fetchDailyContent();
      get().fetchLegacyAuditLogs();
      get().fetchNotifications();
      get().fetchSavedSearches();
      get().fetchSearchSuggestions();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => get().heartbeat(), 300000);
    } catch (error) {
      get().logout();
      set({ isLoading: false, isInitialized: false });
    }
  },
  heartbeat: async () => {
    if (!get().isAuthenticated) return;
    try {
      const user = await api<User>('/api/auth/heartbeat', { method: 'PUT' });
      set({ user });
      get().fetchNotifications();
    } catch (e) { /* silent heartbeat fail */ }
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
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => get().heartbeat(), 300000);
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
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => get().heartbeat(), 300000);
    } catch (error) {
      set({ isLoading: false });
      toast.error('Could not create sanctuary');
      throw error;
    }
  },
  forgotPassword: async (email) => {
    return await api<{ message: string, debugToken?: string }>('/api/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  resetPassword: async (token, password) => {
    await api('/api/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
    toast.success('Security restored. You may now login.');
  },
  logout: () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
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
  deleteAccount: async () => {
    set({ isSaving: true });
    try {
      await api('/api/auth/me', { method: 'DELETE' });
      get().logout();
      toast.success('Account purged. Your data is gone.');
    } catch (e) {
      set({ isSaving: false });
      toast.error('Purge sequence failed');
    }
  },
  updateProfile: async (profile) => {
    set({ isSaving: true });
    try {
      const updated = await api<User>('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      set({ user: updated, isSaving: false });
      toast.success('Preferences synchronized');
    } catch (error) {
      set({ isSaving: false });
      toast.error('Synchronization failed');
    }
  },
  fetchEntries: async (journalId, params = '') => {
    try {
      const url = `/api/journals/${journalId}/entries${params ? `?${params}` : ''}`;
      const entries = await api<Entry[]>(url);
      set({ entries });
    } catch (error) { console.error(error); }
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
    } catch (error) { set({ isSaving: false }); }
  },
  deleteJournal: async (id) => {
    try {
      await api(`/api/journals/${id}`, { method: 'DELETE' });
      set(state => ({
        journals: state.journals.filter(j => j.id !== id),
        entries: state.entries.filter(e => e.journalId !== id)
      }));
    } catch (error) { console.error(error); }
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
    } catch (error) { set({ isSaving: false }); }
  },
  setDraft: (journalId, draft) => {
    const nextDrafts = { ...get().drafts, [journalId]: draft };
    set({ drafts: nextDrafts });
    localStorage.setItem('lumina_drafts', JSON.stringify(nextDrafts));
  },
  clearDraft: (journalId) => {
    const { [journalId]: _, ...rest } = get().drafts;
    set({ drafts: rest });
    localStorage.setItem('lumina_drafts', JSON.stringify(rest));
  },
  fetchInsights: async () => {
    try {
      const insightData = await api<InsightData>('/api/insights');
      set({ insightData });
    } catch (error) { console.error(error); }
  },
  fetchSearchSuggestions: async () => {
    try {
      const searchSuggestions = await api<{ titles: string[], tags: string[] }>('/api/search/suggestions');
      set({ searchSuggestions });
    } catch (e) { console.error(e); }
  },
  addLegacyContact: async (contactData) => {
    set({ isSaving: true });
    try {
      const contact = await api<LegacyContact>('/api/legacy-contacts', {
        method: 'POST', body: JSON.stringify(contactData)
      });
      set(state => ({ legacyContacts: [...state.legacyContacts, contact], isSaving: false }));
    } catch (error) { set({ isSaving: false }); }
  },
  removeLegacyContact: async (id) => {
    try {
      await api(`/api/legacy-contacts/${id}`, { method: 'DELETE' });
      set(state => ({ legacyContacts: state.legacyContacts.filter(c => c.id !== id) }));
    } catch (error) { console.error(error); }
  },
  fetchLegacyAuditLogs: async () => {
    try {
      const logs = await api<LegacyAuditLog[]>('/api/legacy/audit');
      set({ legacyAuditLogs: logs });
    } catch (e) { console.error(e); }
  },
  fetchDailyContent: async () => {
    try {
      const dailyContent = await api<DailyContent>('/api/ai/daily');
      set({ dailyContent });
    } catch (error) { console.error(error); }
  },
  logExport: async (logData) => {
    try {
      const log = await api<ExportLog>('/api/exports', { method: 'POST', body: JSON.stringify(logData) });
      set(state => ({ exportHistory: [log, ...state.exportHistory] }));
    } catch (e) { console.error(e); }
  },
  fetchExportHistory: async () => {
    try {
      const logs = await api<ExportLog[]>('/api/exports');
      set({ exportHistory: logs });
    } catch (e) { console.error(e); }
  },
  sendAiMessage: async (content) => {
    const userMsg: AiMessage = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date().toISOString() };
    set(state => ({ aiChatHistory: [...state.aiChatHistory, userMsg], isSaving: true }));
    try {
      const response = await api<AiMessage>('/api/ai/chat', {
        method: 'POST', body: JSON.stringify({ message: content, history: get().aiChatHistory })
      });
      set(state => {
        const nextHistory = [...state.aiChatHistory, response];
        localStorage.setItem('lumina_chat', JSON.stringify(nextHistory));
        return { aiChatHistory: nextHistory, isSaving: false };
      });
    } catch (error) {
      set({ isSaving: false });
      toast.error('AI link severed. Reconnecting...');
    }
  },
  clearChatHistory: () => {
    localStorage.removeItem('lumina_chat');
    set({ aiChatHistory: [] });
  },
  fetchNotifications: async () => {
    try {
      const notifications = await api<AppNotification[]>('/api/notifications');
      set({ notifications, unreadCount: notifications.filter(n => !n.isRead).length });
    } catch (e) { console.error(e); }
  },
  markNotificationRead: async (id) => {
    const prev = get().notifications;
    set({
      notifications: prev.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, get().unreadCount - 1)
    });
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) { set({ notifications: prev, unreadCount: prev.filter(n => !n.isRead).length }); }
  },
  markAllNotificationsRead: async () => {
    const prev = get().notifications;
    set({ notifications: prev.map(n => ({ ...n, isRead: true })), unreadCount: 0 });
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
    } catch (e) { set({ notifications: prev, unreadCount: prev.filter(n => !n.isRead).length }); }
  },
  deleteNotification: async (id) => {
    const prev = get().notifications;
    const note = prev.find(n => n.id === id);
    set({
      notifications: prev.filter(n => n.id !== id),
      unreadCount: note && !note.isRead ? Math.max(0, get().unreadCount - 1) : get().unreadCount
    });
    try {
      await api(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (e) { set({ notifications: prev, unreadCount: prev.filter(n => !n.isRead).length }); }
  },
  addRecentSearch: (query) => {
    if (!query.trim()) return;
    const next = [query, ...get().recentSearches.filter(q => q !== query)].slice(0, 5);
    set({ recentSearches: next });
    localStorage.setItem('lumina_recent_searches', JSON.stringify(next));
  },
  clearRecentSearches: () => {
    set({ recentSearches: [] });
    localStorage.setItem('lumina_recent_searches', JSON.stringify([]));
  },
  fetchSavedSearches: async () => {
    try {
      const savedSearches = await api<SavedSearch[]>('/api/searches');
      set({ savedSearches });
    } catch (e) { console.error(e); }
  },
  saveSearch: async (searchData) => {
    set({ isSaving: true });
    try {
      const saved = await api<SavedSearch>('/api/searches', {
        method: 'POST', body: JSON.stringify(searchData)
      });
      set(state => ({ savedSearches: [saved, ...state.savedSearches], isSaving: false }));
      toast.success('Search pattern archived');
    } catch (e) { set({ isSaving: false }); }
  },
  deleteSavedSearch: async (id) => {
    try {
      await api(`/api/searches/${id}`, { method: 'DELETE' });
      set(state => ({ savedSearches: state.savedSearches.filter(s => s.id !== id) }));
      toast.success('Search pattern removed');
    } catch (e) { console.error(e); }
  },
  startTour: () => set({ isTourActive: true, tourStep: 0 }),
  nextTourStep: () => set(state => ({ tourStep: state.tourStep + 1 })),
  skipTour: async () => {
    set({ isTourActive: false, tourStep: 0 });
    await get().updateProfile({ onboardingCompleted: true } as any);
  },
  restartTour: async () => {
    set({ isTourActive: true, tourStep: 0 });
    await get().updateProfile({ onboardingCompleted: false } as any);
  }
}));