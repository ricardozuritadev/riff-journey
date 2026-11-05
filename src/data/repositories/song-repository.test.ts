import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDbInstanceForTests } from "@/data/db";
import { ensureSeedData } from "@/data/seed/run-seed";
import { SEED_IDS } from "@/data/seed/ids";
import {
  createSession,
} from "@/data/repositories/practice-repository";
import {
  setManualMasteryCriterion,
  getSong,
} from "@/data/repositories/song-repository";
import { MANUAL_MASTERY_CRITERIA } from "@/domain/constants/mastery";

describe("song mastery persistence", () => {
  beforeEach(async () => {
    resetDbInstanceForTests();
    indexedDB.deleteDatabase("riff-journey");
    await ensureSeedData();
  });

  afterEach(() => {
    const db = getDb();
    if (db.isOpen()) db.close();
    resetDbInstanceForTests();
    indexedDB.deleteDatabase("riff-journey");
  });

  it("does not master until all criteria and two distinct performances", async () => {
    const songId = SEED_IDS.songNothingOnMyBack;

    for (const criterionId of MANUAL_MASTERY_CRITERIA) {
      await setManualMasteryCriterion(songId, criterionId, true);
    }

    let song = await getSong(songId);
    expect(song?.status).toBe("in_progress");

    await createSession({
      songId,
      practicedAt: "2026-01-01T12:00:00.000Z",
      durationMinutes: 40,
      stage: "full_performance",
      techniquesPracticed: [],
      isSatisfactoryFullPerformance: true,
    });

    song = await getSong(songId);
    expect(song?.status).toBe("in_progress");

    await createSession({
      songId,
      practicedAt: "2026-01-02T12:00:00.000Z",
      durationMinutes: 35,
      stage: "full_performance",
      techniquesPracticed: [],
      isSatisfactoryFullPerformance: true,
    });

    song = await getSong(songId);
    expect(song?.status).toBe("mastered");
    expect(song?.learningStage).toBe("mastery");
  });
});
