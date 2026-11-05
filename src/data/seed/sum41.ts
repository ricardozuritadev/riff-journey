import { MANUAL_MASTERY_CRITERIA } from "@/domain/constants/mastery";
import { DEFAULT_TECHNIQUES } from "@/domain/constants/techniques";
import type {
  Album,
  AppSettings,
  Band,
  Song,
  SongMasteryCheck,
  Technique,
} from "@/domain/types";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/dates";
import { CURRENT_SEED_VERSION, SEED_IDS } from "@/data/seed/ids";

export function buildSeedTechniques(): Technique[] {
  return DEFAULT_TECHNIQUES.map((tech) => ({
    id: SEED_IDS.techniques[tech.slug],
    slug: tech.slug,
    name: tech.name,
  }));
}

export function buildSum41Seed(createdAt = nowIso()): {
  band: Band;
  album: Album;
  song: Song;
  checks: SongMasteryCheck[];
  techniques: Technique[];
  settings: AppSettings;
} {
  const band: Band = {
    id: SEED_IDS.bandSum41,
    name: "SUM 41",
    description:
      "Challenge inicial: explorar la discografía de SUM 41 empezando por All Killer No Filler.",
    createdAt,
    challengeStartedAt: createdAt,
    challengeStatus: "active",
  };

  const album: Album = {
    id: SEED_IDS.albumAllKiller,
    bandId: band.id,
    name: "All Killer No Filler",
    releaseYear: 2001,
    sortOrder: 0,
    description: "Álbum debut de estudio de SUM 41.",
  };

  const song: Song = {
    id: SEED_IDS.songNothingOnMyBack,
    albumId: album.id,
    title: "Nothing on My Back",
    trackNumber: 1,
    tuning: "E Standard",
    targetBpm: 192,
    difficulty: "medium",
    status: "in_progress",
    learningStage: "learning",
    createdAt,
  };

  const checks: SongMasteryCheck[] = MANUAL_MASTERY_CRITERIA.map(
    (criterionId) => ({
      id: createId(),
      songId: song.id,
      criterionId,
      completed: false,
    }),
  );

  const techniques = buildSeedTechniques();

  const settings: AppSettings = {
    id: "default",
    activeBandId: band.id,
    seedVersion: CURRENT_SEED_VERSION,
    locale: "es",
    createdAt,
    updatedAt: createdAt,
  };

  return { band, album, song, checks, techniques, settings };
}
