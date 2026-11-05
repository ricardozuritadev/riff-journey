import { getDb } from "@/data/db";
import { MANUAL_MASTERY_CRITERIA } from "@/domain/constants/mastery";
import { LearningStageService } from "@/domain/services/learning-stage";
import { SongMasteryService } from "@/domain/services/song-mastery";
import type {
  LearningStage,
  MasteryCriterionId,
  Song,
  SongMasteryCheck,
} from "@/domain/types";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/dates";

export async function listSongsByAlbum(albumId: string): Promise<Song[]> {
  const songs = await getDb().songs.where("albumId").equals(albumId).toArray();
  return songs.sort((a, b) => a.trackNumber - b.trackNumber);
}

export async function listAllSongs(): Promise<Song[]> {
  return getDb().songs.toArray();
}

export async function getSong(id: string): Promise<Song | undefined> {
  return getDb().songs.get(id);
}

export async function createSong(input: {
  albumId: string;
  title: string;
  trackNumber: number;
  durationSeconds?: number;
  tuning?: string;
  targetBpm?: number;
  difficulty?: Song["difficulty"];
  notes?: string;
}): Promise<Song> {
  const db = getDb();
  const song: Song = {
    id: createId(),
    albumId: input.albumId,
    title: input.title,
    trackNumber: input.trackNumber,
    durationSeconds: input.durationSeconds,
    tuning: input.tuning || undefined,
    targetBpm: input.targetBpm,
    difficulty: input.difficulty,
    notes: input.notes || undefined,
    status: "not_started",
    learningStage: "learning",
    createdAt: nowIso(),
  };

  const checks: SongMasteryCheck[] = MANUAL_MASTERY_CRITERIA.map(
    (criterionId) => ({
      id: createId(),
      songId: song.id,
      criterionId,
      completed: false,
    }),
  );

  await db.transaction("rw", db.songs, db.song_mastery_checks, async () => {
    await db.songs.add(song);
    await db.song_mastery_checks.bulkAdd(checks);
  });

  return song;
}

export async function updateSong(
  id: string,
  patch: Partial<
    Pick<
      Song,
      | "title"
      | "trackNumber"
      | "durationSeconds"
      | "tuning"
      | "targetBpm"
      | "difficulty"
      | "notes"
    >
  >,
): Promise<Song> {
  const existing = await getSong(id);
  if (!existing) {
    throw new Error("Canción no encontrada.");
  }
  const next: Song = {
    ...existing,
    ...patch,
    tuning: patch.tuning === "" ? undefined : (patch.tuning ?? existing.tuning),
    notes: patch.notes === "" ? undefined : (patch.notes ?? existing.notes),
  };
  await getDb().songs.put(next);
  return next;
}

export async function reorderSongs(
  albumId: string,
  orderedIds: string[],
): Promise<void> {
  const db = getDb();
  const songs = await db.songs.where("albumId").equals(albumId).toArray();
  const byId = new Map(songs.map((s) => [s.id, s]));
  const updates: Song[] = orderedIds.map((id, index) => {
    const song = byId.get(id);
    if (!song) {
      throw new Error("Canción no encontrada al reordenar.");
    }
    return { ...song, trackNumber: index + 1 };
  });
  await db.songs.bulkPut(updates);
}

export async function changeSongStage(
  songId: string,
  stage: LearningStage,
): Promise<Song> {
  const song = await getSong(songId);
  if (!song) {
    throw new Error("Canción no encontrada.");
  }
  const changes = LearningStageService.applyStageChange(song, stage);
  const next = { ...song, ...changes };
  await getDb().songs.put(next);
  return next;
}

export async function getMasteryChecks(
  songId: string,
): Promise<SongMasteryCheck[]> {
  return getDb().song_mastery_checks.where("songId").equals(songId).toArray();
}

export async function setManualMasteryCriterion(
  songId: string,
  criterionId: MasteryCriterionId,
  completed: boolean,
): Promise<Song> {
  if (criterionId === "two_satisfactory_performances") {
    throw new Error(
      "Este criterio se calcula automáticamente a partir de las sesiones.",
    );
  }

  const db = getDb();
  const song = await getSong(songId);
  if (!song) {
    throw new Error("Canción no encontrada.");
  }

  const existing = await db.song_mastery_checks
    .where("[songId+criterionId]")
    .equals([songId, criterionId])
    .first();

  const check: SongMasteryCheck = existing
    ? {
        ...existing,
        completed,
        completedAt: completed ? nowIso() : undefined,
      }
    : {
        id: createId(),
        songId,
        criterionId,
        completed,
        completedAt: completed ? nowIso() : undefined,
      };

  const sessions = await db.practice_sessions
    .where("songId")
    .equals(songId)
    .toArray();
  const checks = await getMasteryChecks(songId);
  const nextChecks = [
    ...checks.filter((c) => c.criterionId !== criterionId),
    check,
  ];
  const status = SongMasteryService.resolveSongStatusAfterMasteryCheck(
    song,
    nextChecks,
    sessions,
  );

  const nextSong: Song = {
    ...song,
    status,
    learningStage:
      status === "mastered"
        ? "mastery"
        : song.status === "not_started"
          ? "learning"
          : song.learningStage,
  };
  if (song.status === "not_started" && status !== "mastered") {
    nextSong.status = "in_progress";
  }

  await db.transaction(
    "rw",
    db.songs,
    db.song_mastery_checks,
    async () => {
      await db.song_mastery_checks.put(check);
      await db.songs.put(nextSong);
    },
  );

  return nextSong;
}

export async function reevaluateSongMastery(songId: string): Promise<Song> {
  const db = getDb();
  const song = await getSong(songId);
  if (!song) {
    throw new Error("Canción no encontrada.");
  }
  const checks = await getMasteryChecks(songId);
  const sessions = await db.practice_sessions
    .where("songId")
    .equals(songId)
    .toArray();
  const status = SongMasteryService.resolveSongStatusAfterMasteryCheck(
    song,
    checks,
    sessions,
  );
  const next: Song = {
    ...song,
    status,
    learningStage: status === "mastered" ? "mastery" : song.learningStage,
  };
  if (next.status !== song.status || next.learningStage !== song.learningStage) {
    await db.songs.put(next);
  }
  return next;
}

export async function deleteSongCascade(songId: string): Promise<void> {
  const db = getDb();
  await db.transaction(
    "rw",
    db.songs,
    db.practice_sessions,
    db.song_mastery_checks,
    db.song_techniques,
    async () => {
      await db.practice_sessions.where("songId").equals(songId).delete();
      await db.song_mastery_checks.where("songId").equals(songId).delete();
      await db.song_techniques.where("songId").equals(songId).delete();
      await db.songs.delete(songId);
    },
  );
}

export async function setSongTechniques(
  songId: string,
  techniqueIds: string[],
): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.song_techniques, async () => {
    await db.song_techniques.where("songId").equals(songId).delete();
    const rows = techniqueIds.map((techniqueId) => ({
      id: createId(),
      songId,
      techniqueId,
    }));
    if (rows.length > 0) {
      await db.song_techniques.bulkAdd(rows);
    }
  });
}

export async function getSongTechniqueIds(songId: string): Promise<string[]> {
  const rows = await getDb()
    .song_techniques.where("songId")
    .equals(songId)
    .toArray();
  return rows.map((r) => r.techniqueId);
}
