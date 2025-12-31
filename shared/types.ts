export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type JournalType = 'reflective' | 'fitness' | 'gratitude' | 'legacy' | 'finance' | 'reading' | 'mood' | 'travel' | 'creative' | 'dreams' | 'meals';
export type NotificationType = 'entry' | 'prompt' | 'affirmation' | 'share' | 'access' | 'insight' | 'export' | 'reminder' | 'limit' | 'activity';
export type AnalysisRange = 'week' | 'month' | 'year' | 'all';
export interface UsageStats {
  journalCount: number;
  monthlyEntryCount: number;
  lastResetMonth: string; // YYYY-MM
}
export interface AiInsight {
  id: string;
  userId: string;
  journalId: string;
  range: AnalysisRange;
  content: string;
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
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  language: 'en' | 'es' | 'fr' | 'de';
  defaultJournalId?: string;
  notificationSettings: Record<NotificationType, boolean>;
  e2eEnabled: boolean;
  analyticsOptIn: boolean;
  privacyLevel: 'standard' | 'high';
  onboardingCompleted: boolean;
  tourStep?: number;
  tier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  quietHours: {
    start: string;
    end: string;
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
  usage: UsageStats;
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
  isEncrypted: boolean;
  encryptionVersion?: number;
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
  isEncrypted?: boolean;
  encryptionIV?: string;
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
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}
export interface SearchFilters {
  moods?: string[];
  minStars?: number;
  hasImages?: boolean;
  minWordCount?: number;
  tags?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}
export interface SecurityLog {
  id: string;
  userId: string;
  event: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}
export interface LegacyPublicData {
  journalTitle: string;
  authorName: string;
  passwordRequired: boolean;
  passwordHint?: string;
  expiresAt?: string;
  permissions: LegacyPermissions;
  entries: Entry[] | null;
}
export type LegacyTrigger = 'inactivity' | 'scheduled' | 'manual';