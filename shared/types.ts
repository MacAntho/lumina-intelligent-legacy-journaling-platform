export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type JournalType = 'reflective' | 'fitness' | 'gratitude' | 'legacy';
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  language: 'en' | 'es' | 'fr' | 'de';
  defaultJournalId?: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  preferences: UserPreferences;
  createdAt: string;
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
}
export interface LegacyContact {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: 'pending' | 'verified';
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
export interface LegacyShare {
  id: string;
  journalId: string;
  userId: string;
  recipientEmail: string;
  expiresAt?: string;
  accessKey: string;
  createdAt: string;
}
export interface LegacyPublicData {
  journalTitle: string;
  authorName: string;
  entries: Entry[];
}