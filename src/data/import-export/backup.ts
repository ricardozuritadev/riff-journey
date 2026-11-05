import { z } from "zod";
import { getDb, SCHEMA_VERSION } from "@/data/db";
import {
  challengeStatusSchema,
  learningStageSchema,
  masteryCriterionIdSchema,
  songStatusSchema,
  difficultySchema,
} from "@/domain/schemas";
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
import { nowIso } from "@/lib/dates";

const bandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  artworkUrl: z.string().optional(),
  createdAt: z.string(),
  challengeStartedAt: z.string().optional(),
  challengeCompletedAt: z.string().optional(),
  challengeStatus: challengeStatusSchema,
});

const albumSchema = z.object({
  id: z.string().uuid(),
  bandId: z.string().uuid(),
  name: z.string(),
  releaseYear: z.number().int(),
  sortOrder: z.number().int(),
  artworkUrl: z.string().optional(),
  description: z.string().optional(),
});

const songSchema = z.object({
  id: z.string().uuid(),
  albumId: z.string().uuid(),
  title: z.string(),
  trackNumber: z.number().int(),
  durationSeconds: z.number().int().optional(),
  tuning: z.string().optional(),
  targetBpm: z.number().int().optional(),
  difficulty: difficultySchema.optional(),
  notes: z.string().optional(),
  status: songStatusSchema,
  learningStage: learningStageSchema,
  createdAt: z.string(),
});

const sessionSchema = z.object({
  id: z.string().uuid(),
  songId: z.string().uuid(),
  practicedAt: z.string(),
  durationMinutes: z.number().int(),
  stage: learningStageSchema,
  bpmAchieved: z.number().int().optional(),
  notes: z.string().optional(),
  difficultSections: z.string().optional(),
  techniquesPracticed: z.array(z.string()),
  isSatisfactoryFullPerformance: z.boolean(),
});

const checkSchema = z.object({
  id: z.string().uuid(),
  songId: z.string().uuid(),
  criterionId: masteryCriterionIdSchema,
  completed: z.boolean(),
  completedAt: z.string().optional(),
});

const techniqueSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
});

const songTechniqueSchema = z.object({
  id: z.string().uuid(),
  songId: z.string().uuid(),
  techniqueId: z.string().uuid(),
});

const settingsSchema = z.object({
  id: z.literal("default"),
  activeBandId: z.string().uuid().optional(),
  seedVersion: z.number().int(),
  locale: z.literal("es"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const backupSchema = z.object({
  schemaVersion: z.number().int(),
  exportedAt: z.string(),
  data: z.object({
    bands: z.array(bandSchema),
    albums: z.array(albumSchema),
    songs: z.array(songSchema),
    practice_sessions: z.array(sessionSchema),
    song_mastery_checks: z.array(checkSchema),
    techniques: z.array(techniqueSchema),
    song_techniques: z.array(songTechniqueSchema),
    app_settings: z.array(settingsSchema),
  }),
});

export type BackupPayload = z.infer<typeof backupSchema>;

export async function exportBackup(): Promise<BackupPayload> {
  const db = getDb();
  const [
    bands,
    albums,
    songs,
    practice_sessions,
    song_mastery_checks,
    techniques,
    song_techniques,
    app_settings,
  ] = await Promise.all([
    db.bands.toArray(),
    db.albums.toArray(),
    db.songs.toArray(),
    db.practice_sessions.toArray(),
    db.song_mastery_checks.toArray(),
    db.techniques.toArray(),
    db.song_techniques.toArray(),
    db.app_settings.toArray(),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    data: {
      bands,
      albums,
      songs,
      practice_sessions,
      song_mastery_checks,
      techniques,
      song_techniques,
      app_settings,
    },
  };
}

export async function importBackup(raw: unknown): Promise<void> {
  const payload = backupSchema.parse(raw);
  const db = getDb();

  await db.transaction(
    "rw",
    [
      db.bands,
      db.albums,
      db.songs,
      db.practice_sessions,
      db.song_mastery_checks,
      db.techniques,
      db.song_techniques,
      db.app_settings,
    ],
    async () => {
      await Promise.all([
        db.bands.clear(),
        db.albums.clear(),
        db.songs.clear(),
        db.practice_sessions.clear(),
        db.song_mastery_checks.clear(),
        db.techniques.clear(),
        db.song_techniques.clear(),
        db.app_settings.clear(),
      ]);

      await db.bands.bulkPut(payload.data.bands as Band[]);
      await db.albums.bulkPut(payload.data.albums as Album[]);
      await db.songs.bulkPut(payload.data.songs as Song[]);
      await db.practice_sessions.bulkPut(
        payload.data.practice_sessions as PracticeSession[],
      );
      await db.song_mastery_checks.bulkPut(
        payload.data.song_mastery_checks as SongMasteryCheck[],
      );
      await db.techniques.bulkPut(payload.data.techniques as Technique[]);
      await db.song_techniques.bulkPut(
        payload.data.song_techniques as SongTechnique[],
      );
      await db.app_settings.bulkPut(payload.data.app_settings as AppSettings[]);
    },
  );
}
