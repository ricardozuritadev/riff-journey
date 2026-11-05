import { describe, expect, it } from "vitest";
import { SongMasteryService } from "@/domain/services/song-mastery";
import type { PracticeSession, Song, SongMasteryCheck } from "@/domain/types";

function makeCheck(
  criterionId: SongMasteryCheck["criterionId"],
  completed: boolean,
): SongMasteryCheck {
  return {
    id: crypto.randomUUID(),
    songId: "song-1",
    criterionId,
    completed,
  };
}

function makeSession(
  practicedAt: string,
  satisfactory: boolean,
): PracticeSession {
  return {
    id: crypto.randomUUID(),
    songId: "song-1",
    practicedAt,
    durationMinutes: 30,
    stage: "full_performance",
    techniquesPracticed: [],
    isSatisfactoryFullPerformance: satisfactory,
  };
}

const song: Song = {
  id: "song-1",
  albumId: "album-1",
  title: "Test",
  trackNumber: 1,
  status: "in_progress",
  learningStage: "mastery",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("SongMasteryService", () => {
  it("counts satisfactory performances on distinct calendar days", () => {
    const sessions = [
      makeSession("2026-01-01T10:00:00.000Z", true),
      makeSession("2026-01-01T20:00:00.000Z", true),
      makeSession("2026-01-02T10:00:00.000Z", true),
      makeSession("2026-01-03T10:00:00.000Z", false),
    ];
    expect(
      SongMasteryService.countSatisfactoryFullPerformancesOnDistinctDays(
        sessions,
      ),
    ).toBe(2);
  });

  it("does not mark mastered when manual criteria are incomplete", () => {
    const checks = [
      makeCheck("knows_structure", true),
      makeCheck("plays_every_section", true),
      makeCheck("clean_transitions", false),
      makeCheck("original_tempo", true),
      makeCheck("without_tabs", true),
    ];
    const sessions = [
      makeSession("2026-01-01T10:00:00.000Z", true),
      makeSession("2026-01-02T10:00:00.000Z", true),
    ];
    expect(SongMasteryService.evaluateMastery(checks, sessions)).toBe(false);
  });

  it("marks mastered when all criteria and two distinct-day performances are met", () => {
    const checks = [
      makeCheck("knows_structure", true),
      makeCheck("plays_every_section", true),
      makeCheck("clean_transitions", true),
      makeCheck("original_tempo", true),
      makeCheck("without_tabs", true),
    ];
    const sessions = [
      makeSession("2026-01-01T10:00:00.000Z", true),
      makeSession("2026-01-02T10:00:00.000Z", true),
    ];
    expect(SongMasteryService.evaluateMastery(checks, sessions)).toBe(true);
    expect(
      SongMasteryService.resolveSongStatusAfterMasteryCheck(
        song,
        checks,
        sessions,
      ),
    ).toBe("mastered");
  });

  it("reverts mastered status when criteria become incomplete", () => {
    const masteredSong: Song = { ...song, status: "mastered" };
    const checks = [
      makeCheck("knows_structure", true),
      makeCheck("plays_every_section", false),
      makeCheck("clean_transitions", true),
      makeCheck("original_tempo", true),
      makeCheck("without_tabs", true),
    ];
    expect(
      SongMasteryService.resolveSongStatusAfterMasteryCheck(
        masteredSong,
        checks,
        [
          makeSession("2026-01-01T10:00:00.000Z", true),
          makeSession("2026-01-02T10:00:00.000Z", true),
        ],
      ),
    ).toBe("in_progress");
  });
});
