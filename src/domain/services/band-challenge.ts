import type {
  Band,
  BandProgress,
  ChallengeStatus,
  Song,
} from "@/domain/types";

export function calculateBandProgress(songs: Song[]): BandProgress {
  const totalSongs = songs.length;
  const masteredSongs = songs.filter((s) => s.status === "mastered").length;
  const inProgressSongs = songs.filter(
    (s) => s.status === "in_progress",
  ).length;
  const percent =
    totalSongs === 0 ? 0 : Math.round((masteredSongs / totalSongs) * 100);

  return { totalSongs, masteredSongs, inProgressSongs, percent };
}

export function prepareActivateChallenge(
  bands: Band[],
  targetBandId: string,
  nowIso: string,
): Band[] {
  return bands.map((band) => {
    if (band.id === targetBandId) {
      return {
        ...band,
        challengeStatus: "active" as const,
        challengeStartedAt: band.challengeStartedAt ?? nowIso,
        challengeCompletedAt: undefined,
      };
    }
    if (band.challengeStatus === "active") {
      return {
        ...band,
        challengeStatus: "paused" as const,
      };
    }
    return band;
  });
}

export function prepareCompleteChallenge(
  band: Band,
  progress: BandProgress,
  nowIso: string,
): Band {
  if (progress.totalSongs === 0 || progress.percent < 100) {
    throw new Error(
      "No se puede completar el challenge hasta dominar todas las canciones.",
    );
  }
  return {
    ...band,
    challengeStatus: "completed",
    challengeCompletedAt: nowIso,
  };
}

export function preparePauseChallenge(band: Band): Band {
  if (band.challengeStatus !== "active") {
    throw new Error("Solo se puede pausar un challenge activo.");
  }
  return {
    ...band,
    challengeStatus: "paused",
  };
}

export function isValidChallengeStatus(status: string): status is ChallengeStatus {
  return (
    status === "not_started" ||
    status === "active" ||
    status === "completed" ||
    status === "paused"
  );
}

export const BandChallengeService = {
  calculateBandProgress,
  prepareActivateChallenge,
  prepareCompleteChallenge,
  preparePauseChallenge,
  isValidChallengeStatus,
} as const;
