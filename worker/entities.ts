import { IndexedEntity, Env } from "./core-utils";
import type { User, Journal, Entry, LegacyContact, LegacyShare, ExportLog, LegacyAuditLog, AppNotification, SavedSearch } from "@shared/types";
export interface UserAuthData {
  id: string; // email
  passwordHash: string;
  salt: string;
  profile: User;
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
        notificationSettings: {
          entry: true, prompt: true, affirmation: true, share: true, access: true, insight: true, export: true, reminder: true, limit: true, activity: true
        },
        quietHours: { start: "22:00", end: "08:00", enabled: false }
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
}
export class JournalEntity extends IndexedEntity<Journal> {
  static readonly entityName = "journal";
  static readonly indexName = "journals";
  static readonly initialState: Journal = {
    id: "",
    userId: "",
    templateId: "reflective",
    title: "",
    description: "",
    type: "reflective",
    createdAt: "",
  };
  static async listByUser(env: Env, userId: string): Promise<Journal[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(j => j.userId === userId);
  }
}
export class EntryEntity extends IndexedEntity<Entry> {
  static readonly entityName = "entry";
  static readonly indexName = "entries";
  static readonly initialState: Entry = {
    id: "",
    userId: "",
    journalId: "",
    title: "",
    content: "",
    date: "",
    mood: "Normal",
    tags: [],
    images: [],
    wordCount: 0
  };
  static async listByJournal(env: Env, journalId: string, userId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items
      .filter(e => e.journalId === journalId && (userId === "public" || e.userId === userId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static async listByUser(env: Env, userId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(e => e.userId === userId);
  }
}
export class LegacyContactEntity extends IndexedEntity<LegacyContact> {
  static readonly entityName = "legacy-contact";
  static readonly indexName = "legacy-contacts";
  static readonly initialState: LegacyContact = {
    id: "",
    userId: "",
    name: "",
    email: "",
    relationship: "",
    status: "pending",
    assignedJournalIds: []
  };
  static async listByUser(env: Env, userId: string): Promise<LegacyContact[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(c => c.userId === userId);
  }
}
export class LegacyShareEntity extends IndexedEntity<LegacyShare> {
  static readonly entityName = "legacy-share";
  static readonly indexName = "legacy-shares";
  static readonly initialState: LegacyShare = {
    id: "",
    journalId: "",
    userId: "",
    recipientEmail: "",
    accessKey: "",
    permissions: { canView: true, canDownload: false, canPrint: false },
    viewCount: 0,
    createdAt: ""
  };
}
export class ExportLogEntity extends IndexedEntity<ExportLog> {
  static readonly entityName = "export-log";
  static readonly indexName = "export-logs";
  static readonly initialState: ExportLog = {
    id: "",
    userId: "",
    journalId: "",
    timestamp: "",
    format: "pdf",
    status: "success"
  };
  static async listByUser(env: Env, userId: string): Promise<ExportLog[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(l => l.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
export class LegacyAuditLogEntity extends IndexedEntity<LegacyAuditLog> {
  static readonly entityName = "legacy-audit";
  static readonly indexName = "legacy-audits";
  static readonly initialState: LegacyAuditLog = {
    id: "",
    userId: "",
    shareId: "",
    journalId: "",
    recipientEmail: "",
    action: "view",
    timestamp: ""
  };
  static async listByUser(env: Env, userId: string): Promise<LegacyAuditLog[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(l => l.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
export class NotificationEntity extends IndexedEntity<AppNotification> {
  static readonly entityName = "notification";
  static readonly indexName = "notifications";
  static readonly initialState: AppNotification = {
    id: "",
    userId: "",
    type: "activity",
    title: "",
    message: "",
    isRead: false,
    createdAt: ""
  };
  static async listByUser(env: Env, userId: string): Promise<AppNotification[]> {
    const { items } = await this.list(env, null, 100);
    return items
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  static async markAllAsRead(env: Env, userId: string): Promise<void> {
    const { items } = await this.list(env, null, 1000);
    const userNotes = items.filter(n => n.userId === userId && !n.isRead);
    await Promise.all(userNotes.map(n => new NotificationEntity(env, n.id).patch({ isRead: true })));
  }
}
export class SavedSearchEntity extends IndexedEntity<SavedSearch> {
  static readonly entityName = "saved-search";
  static readonly indexName = "saved-searches";
  static readonly initialState: SavedSearch = {
    id: "",
    userId: "",
    name: "",
    query: "",
    filters: {},
    createdAt: ""
  };
  static async listByUser(env: Env, userId: string): Promise<SavedSearch[]> {
    const { items } = await this.list(env, null, 100);
    return items.filter(s => s.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}