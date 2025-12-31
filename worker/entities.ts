import { IndexedEntity } from "./core-utils";
import type { User, Journal, Entry } from "@shared/types";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "" };
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
  /**
   * Fetch all entries for a specific journal.
   * In a real app, you might use a secondary index. 
   * Here we list all and filter for the demo's simplicity.
   */
  static async listByJournal(env: any, journalId: string): Promise<Entry[]> {
    const { items } = await this.list(env, null, 1000);
    return items.filter(e => e.journalId === journalId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}