import { IndexedEntity } from "./core-utils";
import type { User, Journal, Entry, LegacyContact } from "@shared/types";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "" };
  static readonly seedData: readonly User[] = [{id: 'u1', name: 'Julian Stone', email: 'julian@lumina.io'}];
}
export class JournalEntity extends IndexedEntity<Journal> {
  static readonly entityName = "journal";
  static readonly indexName = "journals";
  static readonly initialState: Journal = {
    id: "",
    title: "",
    description: "",
    type: "reflective",
    createdAt: "",
  };
  static readonly seedData: readonly Journal[] = [];
}
export class EntryEntity extends IndexedEntity<Entry> {
  static readonly entityName = "entry";
  static readonly indexName = "entries";
  static readonly initialState: Entry = {
    id: "",
    journalId: "",
    content: "",
    date: "",
    mood: "Normal",
  };
  static readonly seedData: readonly Entry[] = [];
  /**
   * Fetch all entries for a specific journal.
   */
  static async listByJournal(env: any, journalId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items
      .filter(e => e.journalId === journalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
export class LegacyContactEntity extends IndexedEntity<LegacyContact> {
  static readonly entityName = "legacy-contact";
  static readonly indexName = "legacy-contacts";
  static readonly initialState: LegacyContact = {
    id: "",
    name: "",
    email: "",
    status: "pending"
  };
  static readonly seedData: readonly LegacyContact[] = [];
}