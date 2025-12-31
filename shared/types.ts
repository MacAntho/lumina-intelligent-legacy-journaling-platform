export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type JournalType = 'reflective' | 'fitness' | 'gratitude' | 'legacy';
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface Journal {
  id: string;
  title: string;
  description: string;
  type: JournalType;
  createdAt: string;
  lastEntryAt?: string;
}
export interface Entry {
  id: string;
  journalId: string;
  content: string;
  date: string;
  mood: string;
}
export interface LegacyContact {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'verified';
}
export interface InsightData {
  moodTrends: { date: string; score: number }[];
  writingFrequency: { day: string; count: number }[];
  topTopics: { text: string; value: number }[];
}