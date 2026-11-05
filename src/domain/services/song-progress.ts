import type { Album, Song } from "@/domain/types";

export function sortSongsDiscographically(
  songs: Song[],
  albums: Album[],
): Song[] {
  const albumById = new Map(albums.map((a) => [a.id, a]));
  return [...songs].sort((a, b) => {
    const albumA = albumById.get(a.albumId);
    const albumB = albumById.get(b.albumId);
    const yearA = albumA?.releaseYear ?? 0;
    const yearB = albumB?.releaseYear ?? 0;
    if (yearA !== yearB) return yearA - yearB;
    const orderA = albumA?.sortOrder ?? 0;
    const orderB = albumB?.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.trackNumber - b.trackNumber;
  });
}

export function findCurrentLearningSong(
  songs: Song[],
  albums: Album[],
): Song | null {
  const ordered = sortSongsDiscographically(songs, albums);
  const inProgress = ordered.find((s) => s.status === "in_progress");
  if (inProgress) return inProgress;
  const notStarted = ordered.find((s) => s.status === "not_started");
  return notStarted ?? null;
}

export const SongProgressService = {
  sortSongsDiscographically,
  findCurrentLearningSong,
} as const;
