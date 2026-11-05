import { describe, expect, it } from "vitest";
import { BandChallengeService } from "@/domain/services/band-challenge";
import type { Band, Song } from "@/domain/types";

const bands: Band[] = [
  {
    id: "b1",
    name: "A",
    createdAt: "2026-01-01T00:00:00.000Z",
    challengeStatus: "active",
    challengeStartedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "b2",
    name: "B",
    createdAt: "2026-01-02T00:00:00.000Z",
    challengeStatus: "not_started",
  },
];

describe("BandChallengeService", () => {
  it("calculates progress from songs", () => {
    const songs: Song[] = [
      {
        id: "1",
        albumId: "a",
        title: "x",
        trackNumber: 1,
        status: "mastered",
        learningStage: "mastery",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        albumId: "a",
        title: "y",
        trackNumber: 2,
        status: "in_progress",
        learningStage: "learning",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(BandChallengeService.calculateBandProgress(songs)).toEqual({
      totalSongs: 2,
      masteredSongs: 1,
      inProgressSongs: 1,
      percent: 50,
    });
  });

  it("activates one band and pauses the previous active", () => {
    const updated = BandChallengeService.prepareActivateChallenge(
      bands,
      "b2",
      "2026-02-01T00:00:00.000Z",
    );
    expect(updated.find((b) => b.id === "b1")?.challengeStatus).toBe("paused");
    expect(updated.find((b) => b.id === "b2")?.challengeStatus).toBe("active");
  });

  it("rejects completing incomplete challenges", () => {
    expect(() =>
      BandChallengeService.prepareCompleteChallenge(
        bands[0]!,
        {
          totalSongs: 2,
          masteredSongs: 1,
          inProgressSongs: 1,
          percent: 50,
        },
        "2026-02-01T00:00:00.000Z",
      ),
    ).toThrow();
  });
});
