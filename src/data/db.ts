import Dexie, { type EntityTable } from "dexie";
import type {
  Album,
  AppSettings,
  Band,
  PracticeSession,
  Song,
  SongMasteryCheck,
  SongTechnique,
  Technique,
} from "@/domain/types";

export const DB_NAME = "riff-journey";
export const SCHEMA_VERSION = 1;

export class RiffJourneyDB extends Dexie {
  bands!: EntityTable<Band, "id">;
  albums!: EntityTable<Album, "id">;
  songs!: EntityTable<Song, "id">;
  practice_sessions!: EntityTable<PracticeSession, "id">;
  song_mastery_checks!: EntityTable<SongMasteryCheck, "id">;
  techniques!: EntityTable<Technique, "id">;
  song_techniques!: EntityTable<SongTechnique, "id">;
  app_settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super(DB_NAME);
    this.version(SCHEMA_VERSION).stores({
      bands: "id, name, challengeStatus, createdAt",
      albums: "id, bandId, releaseYear, sortOrder, [bandId+sortOrder]",
      songs:
        "id, albumId, trackNumber, status, learningStage, [albumId+trackNumber]",
      practice_sessions: "id, songId, practicedAt, stage, durationMinutes",
      song_mastery_checks: "id, songId, criterionId, [songId+criterionId]",
      techniques: "id, &slug, name",
      song_techniques: "id, songId, techniqueId, [songId+techniqueId]",
      app_settings: "id",
    });
  }
}

let dbInstance: RiffJourneyDB | null = null;

export function getDb(): RiffJourneyDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB solo está disponible en el cliente.");
  }
  if (!dbInstance) {
    dbInstance = new RiffJourneyDB();
  }
  return dbInstance;
}

/** Test helper to reset singleton between tests. */
export function resetDbInstanceForTests(): void {
  dbInstance = null;
}
