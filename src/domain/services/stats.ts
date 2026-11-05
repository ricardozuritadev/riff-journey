import type {
  Album,
  AppStats,
  Band,
  DashboardStats,
  PracticeSession,
  Song,
  Technique,
} from "@/domain/types";
import { BandChallengeService } from "@/domain/services/band-challenge";

export function calculateDashboardStats(
  songs: Song[],
  sessions: PracticeSession[],
): DashboardStats {
  const masteredSongs = songs.filter((s) => s.status === "mastered").length;
  const inProgressSongs = songs.filter(
    (s) => s.status === "in_progress",
  ).length;
  const totalPracticeMinutes = sessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const overallProgressPercent =
    songs.length === 0
      ? 0
      : Math.round((masteredSongs / songs.length) * 100);

  return {
    masteredSongs,
    inProgressSongs,
    totalPracticeMinutes,
    overallProgressPercent,
  };
}

export function calculateAppStats(input: {
  bands: Band[];
  albums: Album[];
  songs: Song[];
  sessions: PracticeSession[];
  techniques: Technique[];
}): AppStats {
  const { bands, albums, songs, sessions, techniques } = input;
  const dashboard = calculateDashboardStats(songs, sessions);
  const averageSessionMinutes =
    sessions.length === 0
      ? 0
      : Math.round(
          (dashboard.totalPracticeMinutes / sessions.length) * 10,
        ) / 10;

  const masteredByMonth = new Map<string, number>();
  // Approximate: use song createdAt is wrong; we don't store masteredAt.
  // Use practice sessions that completed mastery days as proxy is complex.
  // For MVP: count mastered songs by month of last related satisfactory session,
  // fallback to song createdAt month when none.
  for (const song of songs.filter((s) => s.status === "mastered")) {
    const songSessions = sessions
      .filter((s) => s.songId === song.id && s.isSatisfactoryFullPerformance)
      .sort((a, b) => b.practicedAt.localeCompare(a.practicedAt));
    const monthSource = songSessions[0]?.practicedAt ?? song.createdAt;
    const month = monthSource.slice(0, 7);
    masteredByMonth.set(month, (masteredByMonth.get(month) ?? 0) + 1);
  }

  const masteredPerMonth = [...masteredByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const albumsByBand = new Map<string, Album[]>();
  for (const album of albums) {
    const list = albumsByBand.get(album.bandId) ?? [];
    list.push(album);
    albumsByBand.set(album.bandId, list);
  }

  const progressByBand = bands.map((band) => {
    const bandAlbumIds = new Set(
      (albumsByBand.get(band.id) ?? []).map((a) => a.id),
    );
    const bandSongs = songs.filter((s) => bandAlbumIds.has(s.albumId));
    const progress = BandChallengeService.calculateBandProgress(bandSongs);
    return {
      bandId: band.id,
      bandName: band.name,
      percent: progress.percent,
      mastered: progress.masteredSongs,
      total: progress.totalSongs,
    };
  });

  const activityMap = new Map<string, number>();
  for (const session of sessions) {
    const day = session.practicedAt.slice(0, 10);
    activityMap.set(day, (activityMap.get(day) ?? 0) + session.durationMinutes);
  }
  const practiceActivity = [...activityMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }));

  const techniqueCounts = new Map<string, number>();
  for (const session of sessions) {
    for (const techniqueId of session.techniquesPracticed) {
      techniqueCounts.set(
        techniqueId,
        (techniqueCounts.get(techniqueId) ?? 0) + 1,
      );
    }
  }
  const techniqueNameById = new Map(techniques.map((t) => [t.id, t.name]));
  const topTechniques = [...techniqueCounts.entries()]
    .map(([techniqueId, count]) => ({
      techniqueId,
      name: techniqueNameById.get(techniqueId) ?? "Desconocida",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    masteredSongs: dashboard.masteredSongs,
    inProgressSongs: dashboard.inProgressSongs,
    totalPracticeMinutes: dashboard.totalPracticeMinutes,
    averageSessionMinutes,
    masteredPerMonth,
    progressByBand,
    practiceActivity,
    topTechniques,
  };
}

export const StatsService = {
  calculateDashboardStats,
  calculateAppStats,
} as const;
