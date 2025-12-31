import { IndexedEntity, Env } from "./core-utils";
import type { User, Journal, Entry, LegacyContact, LegacyShare } from "@shared/types";
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
      preferences: { theme: 'system', notificationsEnabled: true, language: 'en' },
      createdAt: ""
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
    images: []
  };
  static async listByJournal(env: Env, journalId: string, userId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items
      .filter(e => e.journalId === journalId && e.userId === userId)
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
    status: "pending"
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
    createdAt: ""
  };
}