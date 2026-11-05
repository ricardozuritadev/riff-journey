import { getDb } from "@/data/db";
import { reevaluateSongMastery } from "@/data/repositories/song-repository";
import type { LearningStage, PracticeSession } from "@/domain/types";
import { createId } from "@/lib/id";

export async function listSessionsBySong(
  songId: string,
): Promise<PracticeSession[]> {
  const sessions = await getDb()
    .practice_sessions.where("songId")
    .equals(songId)
    .toArray();
  return sessions.sort((a, b) => b.practicedAt.localeCompare(a.practicedAt));
}

export async function listAllSessions(): Promise<PracticeSession[]> {
  const sessions = await getDb().practice_sessions.toArray();
  return sessions.sort((a, b) => b.practicedAt.localeCompare(a.practicedAt));
}

export async function getSession(
  id: string,
): Promise<PracticeSession | undefined> {
  return getDb().practice_sessions.get(id);
}

export async function createSession(input: {
  songId: string;
  practicedAt: string;
  durationMinutes: number;
  stage: LearningStage;
  bpmAchieved?: number;
  notes?: string;
  difficultSections?: string;
  techniquesPracticed: string[];
  isSatisfactoryFullPerformance: boolean;
}): Promise<PracticeSession> {
  const db = getDb();
  const song = await db.songs.get(input.songId);
  if (!song) {
    throw new Error("Canción no encontrada.");
  }

  const session: PracticeSession = {
    id: createId(),
    songId: input.songId,
    practicedAt: new Date(input.practicedAt).toISOString(),
    durationMinutes: input.durationMinutes,
    stage: input.stage,
    bpmAchieved: input.bpmAchieved,
    notes: input.notes || undefined,
    difficultSections: input.difficultSections || undefined,
    techniquesPracticed: input.techniquesPracticed,
    isSatisfactoryFullPerformance: input.isSatisfactoryFullPerformance,
  };

  await db.practice_sessions.add(session);

  if (song.status === "not_started") {
    await db.songs.put({ ...song, status: "in_progress" });
  }

  await reevaluateSongMastery(input.songId);
  return session;
}

export async function updateSession(
  id: string,
  patch: Partial<
    Pick<
      PracticeSession,
      | "practicedAt"
      | "durationMinutes"
      | "stage"
      | "bpmAchieved"
      | "notes"
      | "difficultSections"
      | "techniquesPracticed"
      | "isSatisfactoryFullPerformance"
    >
  >,
): Promise<PracticeSession> {
  const existing = await getSession(id);
  if (!existing) {
    throw new Error("Sesión no encontrada.");
  }

  const next: PracticeSession = {
    ...existing,
    ...patch,
    practicedAt: patch.practicedAt
      ? new Date(patch.practicedAt).toISOString()
      : existing.practicedAt,
    notes: patch.notes === "" ? undefined : (patch.notes ?? existing.notes),
    difficultSections:
      patch.difficultSections === ""
        ? undefined
        : (patch.difficultSections ?? existing.difficultSections),
  };

  await getDb().practice_sessions.put(next);
  await reevaluateSongMastery(existing.songId);
  return next;
}

export async function deleteSession(id: string): Promise<void> {
  const existing = await getSession(id);
  if (!existing) {
    return;
  }
  await getDb().practice_sessions.delete(id);
  await reevaluateSongMastery(existing.songId);
}
