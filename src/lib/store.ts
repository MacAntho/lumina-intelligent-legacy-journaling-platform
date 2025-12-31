import { create } from 'zustand';
import { api } from './api-client';
import { toast } from 'sonner';
import type {
  Journal, Entry, User, LegacyContact, InsightData, SavedSearch, AiInsight,
  LoginRequest, RegisterRequest, AuthResponse, AiMessage,
  DailyContent, ExportLog, LegacyAuditLog, AppNotification,
  SubscriptionTier, ExportOptions
} from '@shared/types';
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLimitReached: (type: 'journal' | 'entry') => boolean;
  journals: Journal[];
  entries: Entry[];
  journalInsights: AiInsight[];
  drafts: Record<string, Partial<Entry>>;
  legacyContacts: LegacyContact[];
  legacyAuditLogs: LegacyAuditLog[];
  insightData: InsightData | null;
  aiChatHistory: AiMessage[];
  dailyContent: DailyContent | null;
  promptHistory: DailyContent[];
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
  createCheckoutSession: (tier: SubscriptionTier) => Promise<void>;
  exportAllData: () => Promise<void>;
  heartbeat: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  fetchEntries: (journalId: string, params?: string) => Promise<void>;
  addJournal: (journal: Partial<Journal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  fetchJournalPatterns: (journalId: string, range: string) => Promise<AiInsight>;
  fetchInsightHistory: () => Promise<void>;
  addEntry: (entry: Partial<Entry>) => Promise<void>;
  setDraft: (journalId: string, draft: Partial<Entry>) => void;
  clearDraft: (journalId: string) => void;
  fetchInsights: () => Promise<void>;
  fetchSearchSuggestions: () => Promise<void>;
  addLegacyContact: (contact: Partial<LegacyContact>) => Promise<void>;
  removeLegacyContact: (id: string) => Promise<void>;
  fetchLegacyAuditLogs: () => Promise<void>;
  fetchDailyContent: (refresh?: boolean) => Promise<void>;
  fetchPromptHistory: () => Promise<void>;
  generateContextualPrompt: (journalId: string, templateId: string) => Promise<DailyContent>;
  logExport: (log: Partial<ExportLog>) => Promise<void>;
  exportJournalPdf: (journalId: string, options: ExportOptions) => Promise<void>;
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
  journalInsights: [],
  drafts: JSON.parse(localStorage.getItem('lumina_drafts') || '{}'),
  legacyContacts: [],
  legacyAuditLogs: [],
  insightData: null,
  aiChatHistory: JSON.parse(localStorage.getItem('lumina_chat') || '[]'),
  dailyContent: null,
  promptHistory: [],
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
    if (!token || get().isInitialized || get().isLoading) return;
    set({ isLoading: true });
    try {
      const [user, journals, contacts, entries, insights] = await Promise.all([
        api<User>('/api/auth/me'),
        api<Journal[]>('/api/journals'),
        api<LegacyContact[]>('/api/legacy-contacts'),
        api<Entry[]>('/api/entries/all').catch(() => []),
        api<AiInsight[]>('/api/ai/insights/history').catch(() => [])
      ]);
      set({
        user, journals, entries, legacyContacts: contacts, journalInsights: insights,
        isAuthenticated: true, isLoading: false, isInitialized: true,
        isTourActive: !user.preferences?.onboardingCompleted
      });
      get().fetchDailyContent().catch(() => {});
      get().fetchNotifications().catch(() => {});
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => get().heartbeat(), 300000);
    } catch (error) {
      console.error('Initialization failed:', error);
      get().logout();
      set({ isLoading: false, isInitialized: false });
    }
  },
  isLimitReached: (type) => {
    const user = get().user;
    if (!user || !user.usage) return false;
    const tier = user.preferences.tier || 'free';
    const limits = {
      free: { j: 3, e: 100 },
      premium: { j: 1000, e: 10000 },
      pro: { j: 10000, e: 100000 }
    };
    const currentLimits = limits[tier] || limits.free;
    const reached = type === 'journal' 
      ? (user.usage.journalCount || 0) >= currentLimits.j
      : (user.usage.monthlyEntryCount || 0) >= currentLimits.e;
    if (reached) {
      console.warn(`Tier limit reached for ${type}. Current: ${type === 'journal' ? user.usage.journalCount : user.usage.monthlyEntryCount}, Limit: ${type === 'journal' ? currentLimits.j : currentLimits.e}`);
    }
    return reached;
  },
  heartbeat: async () => {
    if (!get().isAuthenticated || !get().token) return;
    try {
      const user = await api<User>('/api/auth/me', { silent: true });
      set({ user });
    } catch (e) {
      console.warn('Heartbeat silent failure');
    }
  },
  login: async (req) => {
    set({ isLoading: true });
    try {
      const res = await api<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(req) });
      localStorage.setItem('lumina_token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false, isInitialized: true });
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
      const res = await api<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(req) });
      localStorage.setItem('lumina_token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false, isInitialized: true });
      toast.success('Your digital legacy has begun.');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Could not create sanctuary');
      throw error;
    }
  },
  updateProfile: async (profileUpdates) => {
    set({ isSaving: true });
    try {
      const updated = await api<User>('/api/auth/settings', { method: 'PUT', body: JSON.stringify(profileUpdates) });
      set({ user: updated, isSaving: false });
      toast.success('Preferences synchronized');
    } catch (error) {
      set({ isSaving: false });
      toast.error('Synchronization failed');
    }
  },
  createCheckoutSession: async (tier) => {
    try {
      const res = await api<{ url: string }>('/api/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ tier }) });
      window.location.href = res.url;
    } catch (e) {
      toast.error('Payment gateway unavailable');
    }
  },
  fetchEntries: async (journalId, params = '') => {
    try {
      const url = `/api/journals/${journalId}/entries${params ? `?${params}` : ''}`;
      const entries = await api<Entry[]>(url);
      set({ entries });
    } catch (error) {
      console.error(`Failed to fetch entries for journal ${journalId}`, error);
    }
  },
  addJournal: async (journalData) => {
    set({ isSaving: true });
    try {
      const journal = await api<Journal>('/api/journals', { method: 'POST', body: JSON.stringify(journalData) });
      set(state => ({ journals: [...state.journals, journal], isSaving: false }));
      toast.success('New sanctuary initialized');
    } catch (error) {
      set({ isSaving: false });
      toast.error('Failed to create journal');
    }
  },
  deleteJournal: async (id) => {
    try {
      await api(`/api/journals/${id}`, { method: 'DELETE' });
      set(state => ({
        journals: state.journals.filter(j => j.id !== id),
        entries: state.entries.filter(e => e.journalId !== id)
      }));
      toast.success('Journal removed');
    } catch (error) {
      toast.error('Failed to remove journal');
    }
  },
  fetchJournalPatterns: async (journalId, range) => {
    set({ isSaving: true });
    try {
      const insight = await api<AiInsight>(`/api/ai/insights/patterns?journalId=${journalId}&range=${range}`);
      set(s => ({ journalInsights: [insight, ...s.journalInsights], isSaving: false }));
      return insight;
    } catch (e) {
      set({ isSaving: false });
      toast.error('Intelligence Analysis failed');
      throw e;
    }
  },
  fetchInsightHistory: async () => {
    try {
      const history = await api<AiInsight[]>('/api/ai/insights/history');
      set({ journalInsights: history });
    } catch (e) { console.warn('Insight history fetch failed'); }
  },
  addEntry: async (entryData) => {
    set({ isSaving: true });
    try {
      const entry = await api<Entry>(`/api/journals/${entryData.journalId}/entries`, { method: 'POST', body: JSON.stringify(entryData) });
      set(state => ({
        entries: [entry, ...state.entries],
        journals: state.journals.map(j => j.id === entry.journalId ? { ...j, lastEntryAt: entry.date } : j),
        isSaving: false
      }));
      get().clearDraft(entry.journalId || "");
    } catch (error) {
      set({ isSaving: false });
      toast.error('Failed to preserve entry');
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
      dailyContent: null, promptHistory: [], notifications: [], unreadCount: 0, recentSearches: [],
      savedSearches: [], isInitialized: false, isLoading: false, isTourActive: false, tourStep: 0
    });
  },
  forgotPassword: async (email) => api('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: async (token, password) => api('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  deleteAccount: async () => {
    set({ isSaving: true });
    try {
      await api('/api/auth/me', { method: 'DELETE' });
      get().logout();
      toast.success('Sanctuary purged.');
    } catch (e) {
      set({ isSaving: false });
    }
  },
  exportAllData: async () => {
    try {
      const data = await api<any>('/api/users/me/export-all');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `lumina-export.json`; a.click();
    } catch (e) { toast.error("Export failed"); }
  },
  setDraft: (journalId, draft) => {
    const next = { ...get().drafts, [journalId]: draft };
    set({ drafts: next });
    localStorage.setItem('lumina_drafts', JSON.stringify(next));
  },
  clearDraft: (journalId) => {
    const { [journalId]: _, ...rest } = get().drafts;
    set({ drafts: rest });
    localStorage.setItem('lumina_drafts', JSON.stringify(rest));
  },
  fetchInsights: async () => {
    try {
      const data = await api<InsightData>('/api/insights');
      set({ insightData: data });
    } catch (e) { console.warn('Insights fetch failed'); }
  },
  fetchSearchSuggestions: async () => {
    try {
      const data = await api<{ titles: string[], tags: string[] }>('/api/search/suggestions');
      set({ searchSuggestions: data });
    } catch (e) { console.warn('Suggestions fetch failed'); }
  },
  addLegacyContact: async (data) => {
    try {
      const c = await api<LegacyContact>('/api/legacy-contacts', { method: 'POST', body: JSON.stringify(data) });
      set(s => ({ legacyContacts: [...s.legacyContacts, c] }));
    } catch (e) { console.error('Failed to add contact'); }
  },
  removeLegacyContact: async (id) => {
    try {
      await api(`/api/legacy-contacts/${id}`, { method: 'DELETE' });
      set(s => ({ legacyContacts: s.legacyContacts.filter(c => c.id !== id) }));
    } catch (e) { console.error('Failed to remove contact'); }
  },
  fetchLegacyAuditLogs: async () => {
    try {
      const logs = await api<LegacyAuditLog[]>('/api/legacy/audit');
      set({ legacyAuditLogs: logs });
    } catch (e) { console.warn('Audit logs fetch failed'); }
  },
  fetchDailyContent: async (refresh = false) => {
    try {
      const data = await api<DailyContent>(`/api/ai/daily${refresh ? '?refresh=true' : ''}`);
      set({ dailyContent: data });
    } catch (e) { console.warn('Daily content fetch failed'); }
  },
  fetchPromptHistory: async () => {
    try {
      const data = await api<DailyContent[]>('/api/ai/prompts/history');
      set({ promptHistory: data });
    } catch (e) { console.warn('Prompt history fetch failed'); }
  },
  generateContextualPrompt: async (journalId, templateId) => {
    try {
      return await api<DailyContent>('/api/ai/prompts/contextual', {
        method: 'POST',
        body: JSON.stringify({ journalId, templateId })
      });
    } catch (e) {
      return { prompt: "Reflect on your current thoughts and intentions.", affirmation: "I am clear and focused." };
    }
  },
  logExport: async (data) => {
    try {
      const log = await api<ExportLog>('/api/exports', { method: 'POST', body: JSON.stringify(data) });
      set(s => ({ exportHistory: [log, ...s.exportHistory] }));
    } catch (e) { console.error('Export logging failed'); }
  },
  exportJournalPdf: async (journalId, opts) => {
    set({ isSaving: true });
    try {
      const params = new URLSearchParams({
        journalId,
        title: opts.title || '',
        author: opts.author || '',
        message: opts.customMessage || '',
        images: String(!!opts.includeImages),
        tags: String(!!opts.includeTags),
        contrast: String(!!opts.highContrast)
      });
      const blob = await api<Blob>(`/api/export/pdf?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${opts.title || 'journal'}-archive.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Export failed');
    } finally { set({ isSaving: false }); }
  },
  fetchExportHistory: async () => {
    try {
      const logs = await api<ExportLog[]>('/api/exports');
      set({ exportHistory: logs });
    } catch (e) { console.warn('Export history fetch failed'); }
  },
  sendAiMessage: async (content) => {
    const history = get().aiChatHistory;
    const userMsg: AiMessage = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date().toISOString() };
    const newHistory = [...history, userMsg];
    set({ aiChatHistory: newHistory, isSaving: true });
    try {
      const responseText = await api<string>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: content, history: history.slice(-10) })
      });
      const botMsg: AiMessage = { id: crypto.randomUUID(), role: 'assistant', content: responseText, timestamp: new Date().toISOString() };
      const finalHistory = [...newHistory, botMsg];
      set({ aiChatHistory: finalHistory });
      localStorage.setItem('lumina_chat', JSON.stringify(finalHistory));
    } catch (e) {
      toast.error("Intelligence Link is unstable");
    } finally { set({ isSaving: false }); }
  },
  clearChatHistory: () => {
    localStorage.removeItem('lumina_chat');
    set({ aiChatHistory: [] });
  },
  fetchNotifications: async () => {
    try {
      const notes = await api<AppNotification[]>('/api/notifications');
      set({ notifications: notes, unreadCount: notes.filter(n => !n.isRead).length });
    } catch (e) { console.warn('Notifications fetch failed'); }
  },
  markNotificationRead: async (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1)
    }));
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) { console.error('Failed to mark read'); }
  },
  markAllNotificationsRead: async () => {
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })), unreadCount: 0 }));
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
    } catch (e) { console.error('Failed to mark all read'); }
  },
  deleteNotification: async (id) => {
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
    try {
      await api(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (e) { console.error('Failed to delete notification'); }
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
      const data = await api<SavedSearch[]>('/api/searches');
      set({ savedSearches: data });
    } catch (e) { console.warn('Saved searches fetch failed'); }
  },
  saveSearch: async (data) => {
    try {
      const s = await api<SavedSearch>('/api/searches', { method: 'POST', body: JSON.stringify(data) });
      set(st => ({ savedSearches: [s, ...st.savedSearches] }));
    } catch (e) { console.error('Failed to save search'); }
  },
  deleteSavedSearch: async (id) => {
    try {
      await api(`/api/searches/${id}`, { method: 'DELETE' });
      set(s => ({ savedSearches: s.savedSearches.filter(st => st.id !== id) }));
    } catch (e) { console.error('Failed to delete search'); }
  },
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