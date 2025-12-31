import { IndexedEntity, Env } from "./core-utils";
import type { User, Journal, Entry, LegacyContact, LegacyShare, ExportLog, LegacyAuditLog, AppNotification, SavedSearch, DailyContent, AiInsight, SecurityLog, UsageStats } from "@shared/types";
export interface UserAuthData {
  id: string; // email
  passwordHash: string;
  salt: string;
  profile: User;
  resetToken?: string;
  resetExpires?: string;
}
export interface PromptRecord extends DailyContent {
  id: string;
  userId: string;
  type: 'daily' | 'contextual';
  createdAt: string;
}
export class UsageEntity extends IndexedEntity<UsageStats & { id: string }> {
  static readonly entityName = "usage";
  static readonly indexName = "usages";
  static readonly initialState: UsageStats & { id: string } = {
    id: "",
    journalCount: 0,
    monthlyEntryCount: 0,
    lastResetMonth: ""
  };
  static async getAndReset(env: Env, userId: string): Promise<UsageStats> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const inst = new UsageEntity(env, userId);
    let state = await inst.getState();
    if (state.lastResetMonth !== currentMonth) {
      state = {
        ...state,
        id: userId,
        monthlyEntryCount: 0,
        lastResetMonth: currentMonth
      };
      await inst.save(state);
    }
    return state;
  }
}
export class UserAuthEntity extends IndexedEntity<UserAuthData> {
  static readonly entityName = "user-auth";
  static readonly indexName = "users-auth";
  static readonly initialState: UserAuthData = {
    id: "",
    passwordHash: "",
    salt: "",
    profile: {
      id: "",
      name: "",
      email: "",
      preferences: {
        theme: 'system',
        notificationsEnabled: true,
        language: 'en',
        onboardingCompleted: false,
        e2eEnabled: false,
        analyticsOptIn: true,
        privacyLevel: 'standard',
        tier: 'free',
        subscriptionStatus: 'active',
        notificationSettings: {
          entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true
        },
        quietHours: { start: "22:00", end: "08:00", enabled: false }
      },
      usage: {
        journalCount: 0,
        monthlyEntryCount: 0,
        lastResetMonth: new Date().toISOString().slice(0, 7)
      },
      createdAt: "",
      lastHeartbeatAt: ""
    }
  };
  static async findByEmail(env: Env, email: string): Promise<UserAuthData | null> {
    const inst = new UserAuthEntity(env, email.toLowerCase());
    if (await inst.exists()) {
      return await inst.getState();
    }
    return null;
  }
  static async purgeAllUserData(env: Env, userId: string, email: string) {
    await JournalEntity.deleteManyByUser(env, userId);
    await EntryEntity.deleteManyByUser(env, userId);
    await LegacyContactEntity.deleteManyByUser(env, userId);
    await ExportLogEntity.deleteManyByUser(env, userId);
    await LegacyAuditLogEntity.deleteManyByUser(env, userId);
    await NotificationEntity.deleteManyByUser(env, userId);
    await SavedSearchEntity.deleteManyByUser(env, userId);
    await PromptEntity.deleteManyByUser(env, userId);
    await AiInsightEntity.deleteManyByUser(env, userId);
    await SecurityLogEntity.deleteManyByUser(env, userId);
    await UsageEntity.delete(env, userId);
    await UserAuthEntity.delete(env, email.toLowerCase());
  }
}
export class PromptEntity extends IndexedEntity<PromptRecord> {
  static readonly entityName = "prompt";
  static readonly indexName = "prompts";
  static readonly initialState: PromptRecord = {
    id: "", userId: "", prompt: "", affirmation: "", type: "daily", createdAt: ""
  };
  static async listByUser(env: Env, userId: string): Promise<PromptRecord[]> {
    const { items } = await this.list(env, null, 100);
    return items.filter(p => p.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}
export class JournalEntity extends IndexedEntity<Journal> {
  static readonly entityName = "journal";
  static readonly indexName = "journals";
  static readonly initialState: Journal = {
    id: "", userId: "", templateId: "reflective", title: "", description: "", type: "reflective", isEncrypted: false, createdAt: "",
  };
  static async listByUser(env: Env, userId: string): Promise<Journal[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(j => j.userId === userId);
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const journals = await this.listByUser(env, userId);
    if (journals.length > 0) await this.deleteMany(env, journals.map(j => j.id));
  }
}
export class EntryEntity extends IndexedEntity<Entry> {
  static readonly entityName = "entry";
  static readonly indexName = "entries";
  static readonly initialState: Entry = {
    id: "", userId: "", journalId: "", title: "", content: "", date: "", mood: "Normal", tags: [], images: [], wordCount: 0
  };
  static async listByJournal(env: Env, journalId: string, userId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(e => e.journalId === journalId && (userId === "public" || e.userId === userId)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static async listByUser(env: Env, userId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(e => e.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static async getRecentEntriesContent(env: Env, userId: string, days: number = 7): Promise<string> {
    const entries = await this.listByUser(env, userId);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return entries.filter(e => new Date(e.date).getTime() > cutoff).map(e => e.content).join("\n\n");
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const entries = await this.listByUser(env, userId);
    if (entries.length > 0) await this.deleteMany(env, entries.map(e => e.id));
  }
  static async getSuggestions(env: Env, userId: string): Promise<{ titles: string[], tags: string[] }> {
    const entries = await this.listByUser(env, userId);
    const titles = Array.from(new Set(entries.map(e => e.title).filter((t): t is string => !!t)));
    const tags = Array.from(new Set(entries.flatMap(e => e.tags || [])));
    return { titles, tags };
  }
}
export class SecurityLogEntity extends IndexedEntity<SecurityLog> {
  static readonly entityName = "security-log";
  static readonly indexName = "security-logs";
  static readonly initialState: SecurityLog = {
    id: "", userId: "", event: "login", ip: "", userAgent: "", timestamp: ""
  };
  static async listByUser(env: Env, userId: string): Promise<SecurityLog[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(l => l.userId === userId);
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(l => l.id));
  }
}
export class AiInsightEntity extends IndexedEntity<AiInsight> {
  static readonly entityName = "ai-insight";
  static readonly indexName = "ai-insights";
  static readonly initialState: AiInsight = {
    id: "", userId: "", journalId: "", range: "week", content: "", moodScore: 3, topThemes: [], goalsIdentified: [], growthIndicators: [], createdAt: ""
  };
  static async listByUser(env: Env, userId: string): Promise<AiInsight[]> {
    const { items } = await this.list(env, null, 100);
    return items.filter(i => i.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}
export class LegacyContactEntity extends IndexedEntity<LegacyContact> {
  static readonly entityName = "legacy-contact";
  static readonly indexName = "legacy-contacts";
  static readonly initialState: LegacyContact = {
    id: "", userId: "", name: "", email: "", relationship: "", status: "pending", assignedJournalIds: []
  };
  static async listByUser(env: Env, userId: string): Promise<LegacyContact[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(c => c.userId === userId);
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}
export class LegacyShareEntity extends IndexedEntity<LegacyShare> {
  static readonly entityName = "legacy-share";
  static readonly indexName = "legacy-shares";
  static readonly initialState: LegacyShare = {
    id: "", journalId: "", userId: "", recipientEmail: "", accessKey: "", permissions: { canView: true, canDownload: false, canPrint: false }, viewCount: 0, createdAt: ""
  };
}
export class ExportLogEntity extends IndexedEntity<ExportLog> {
  static readonly entityName = "export-log";
  static readonly indexName = "export-logs";
  static readonly initialState: ExportLog = {
    id: "", userId: "", journalId: "", timestamp: "", format: "pdf", status: "success"
  };
  static async listByUser(env: Env, userId: string): Promise<ExportLog[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(l => l.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}
export class LegacyAuditLogEntity extends IndexedEntity<LegacyAuditLog> {
  static readonly entityName = "legacy-audit";
  static readonly indexName = "legacy-audits";
  static readonly initialState: LegacyAuditLog = {
    id: "", userId: "", shareId: "", journalId: "", recipientEmail: "", action: "view", timestamp: ""
  };
  static async listByUser(env: Env, userId: string): Promise<LegacyAuditLog[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(l => l.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}
export class NotificationEntity extends IndexedEntity<AppNotification> {
  static readonly entityName = "notification";
  static readonly indexName = "notifications";
  static readonly initialState: AppNotification = {
    id: "", userId: "", type: "activity", title: "", message: "", isRead: false, createdAt: ""
  };
  static async listByUser(env: Env, userId: string): Promise<AppNotification[]> {
    const { items } = await this.list(env, null, 100);
    return items.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  static async markAllAsRead(env: Env, userId: string): Promise<void> {
    const notes = await this.listByUser(env, userId);
    const unread = notes.filter(n => !n.isRead);
    await Promise.all(unread.map(n => new NotificationEntity(env, n.id).patch({ isRead: true })));
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}
export class SavedSearchEntity extends IndexedEntity<SavedSearch> {
  static readonly entityName = "saved-search";
  static readonly indexName = "saved-searches";
  static readonly initialState: SavedSearch = {
    id: "", userId: "", name: "", query: "", filters: {}, createdAt: ""
  };
  static async listByUser(env: Env, userId: string): Promise<SavedSearch[]> {
    const { items } = await this.list(env, null, 100);
    return items.filter(s => s.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  static async deleteManyByUser(env: Env, userId: string) {
    const items = await this.listByUser(env, userId);
    if (items.length > 0) await this.deleteMany(env, items.map(i => i.id));
  }
}