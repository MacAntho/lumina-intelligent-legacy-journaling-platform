export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type JournalType = 'reflective' | 'fitness' | 'gratitude' | 'legacy' | 'finance' | 'reading' | 'mood' | 'travel' | 'creative' | 'dreams' | 'meals';
export type NotificationType = 'entry' | 'prompt' | 'affirmation' | 'share' | 'access' | 'insight' | 'export' | 'reminder' | 'limit' | 'activity';
export type AnalysisRange = 'week' | 'month' | 'year' | 'all';
export interface AiInsight {
  id: string;
  userId: string;
  journalId: string;
  range: AnalysisRange;
  content: string; // The structured narrative
  moodScore: number;
  topThemes: string[];
  goalsIdentified: string[];
  growthIndicators: string[];
  createdAt: string;
}
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}
export interface SearchFilters {
  dateRange?: { start: string; end: string };
  moods?: string[];
  minStars?: number;
  templateIds?: string[];
  hasImages?: boolean;
  tags?: string[];
  minWordCount?: number;
}
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  language: 'en' | 'es' | 'fr' | 'de';
  defaultJournalId?: string;
  notificationSettings: Record<NotificationType, boolean>;
  onboardingCompleted: boolean;
  tourStep?: number;
  quietHours: {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    enabled: boolean;
  };
}
export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  preferences: UserPreferences;
  createdAt: string;
  lastHeartbeatAt?: string;
}
export interface AuthResponse {
  user: User;
  token: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}
export interface Journal {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  description: string;
  type: JournalType;
  createdAt: string;
  lastEntryAt?: string;
}
export interface Entry {
  id: string;
  userId: string;
  journalId: string;
  title?: string;
  content: string;
  structuredData?: Record<string, any>;
  date: string;
  updatedAt?: string;
  mood: string;
  tags: string[];
  images: string[];
  wordCount: number;
}
export interface LegacyContact {
  id: string;
  userId: string;
  name: string;
  email: string;
  relationship?: string;
  status: 'pending' | 'verified';
  assignedJournalIds: string[];
  lastVerifiedAt?: string;
}
export interface InsightData {
  moodTrends: { date: string; score: number }[];
  writingFrequency: { day: string; count: number }[];
  topTopics: { text: string; value: number }[];
}
export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
export interface DailyContent {
  prompt: string;
  affirmation: string;
  targetJournalId?: string;
}
export interface LegacyPermissions {
  canView: boolean;
  canDownload: boolean;
  canPrint: boolean;
}
export interface LegacyShare {
  id: string;
  journalId: string;
  userId: string;
  recipientEmail: string;
  expiresAt?: string;
  accessKey: string;
  passwordHash?: string;
  passwordHint?: string;
  permissions: LegacyPermissions;
  viewCount: number;
  createdAt: string;
}
export interface LegacyPublicData {
  journalTitle: string;
  authorName: string;
  entries: Entry[];
  permissions: LegacyPermissions;
  passwordRequired: boolean;
  passwordHint?: string;
  expiresAt?: string;
}
export interface ExportOptions {
  title: string;
  author: string;
  includeImages: boolean;
  includeTags: boolean;
  startDate?: string;
  endDate?: string;
  customMessage?: string;
  highContrast?: boolean;
}
export interface ExportLog {
  id: string;
  userId: string;
  journalId: string;
  timestamp: string;
  format: 'pdf' | 'json';
  status: 'success' | 'failed';
  options?: Partial<ExportOptions>;
}
export interface LegacyAuditLog {
  id: string;
  userId: string;
  shareId: string;
  journalId: string;
  recipientEmail: string;
  action: 'view' | 'download' | 'print' | 'revoke' | 'create';
  timestamp: string;
  ip?: string;
  userAgent?: string;
}
export type LegacyTrigger = 'inactivity' | 'scheduled' | 'manual';