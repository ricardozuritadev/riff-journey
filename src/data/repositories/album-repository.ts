import { getDb } from "@/data/db";
import type { Album } from "@/domain/types";
import { createId } from "@/lib/id";
import { deleteSongCascade } from "@/data/repositories/song-repository";

export async function listAlbumsByBand(bandId: string): Promise<Album[]> {
  const albums = await getDb().albums.where("bandId").equals(bandId).toArray();
  return albums.sort((a, b) => {
    if (a.releaseYear !== b.releaseYear) {
      return a.releaseYear - b.releaseYear;
    }
    return a.sortOrder - b.sortOrder;
  });
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  return getDb().albums.get(id);
}

export async function createAlbum(input: {
  bandId: string;
  name: string;
  releaseYear: number;
  description?: string;
  artworkUrl?: string;
}): Promise<Album> {
  const existing = await listAlbumsByBand(input.bandId);
  const album: Album = {
    id: createId(),
    bandId: input.bandId,
    name: input.name,
    releaseYear: input.releaseYear,
    sortOrder: existing.length,
    description: input.description || undefined,
    artworkUrl: input.artworkUrl || undefined,
  };
  await getDb().albums.add(album);
  return album;
}

export async function updateAlbum(
  id: string,
  patch: Partial<
    Pick<Album, "name" | "releaseYear" | "description" | "artworkUrl">
  >,
): Promise<Album> {
  const existing = await getAlbum(id);
  if (!existing) {
    throw new Error("Álbum no encontrado.");
  }
  const next: Album = {
    ...existing,
    ...patch,
    description:
      patch.description === ""
        ? undefined
        : (patch.description ?? existing.description),
    artworkUrl:
      patch.artworkUrl === ""
        ? undefined
        : (patch.artworkUrl ?? existing.artworkUrl),
  };
  await getDb().albums.put(next);
  return next;
}

export async function reorderAlbums(
  bandId: string,
  orderedIds: string[],
): Promise<void> {
  const db = getDb();
  const albums = await db.albums.where("bandId").equals(bandId).toArray();
  const byId = new Map(albums.map((a) => [a.id, a]));
  const updates: Album[] = orderedIds.map((id, index) => {
    const album = byId.get(id);
    if (!album) {
      throw new Error("Álbum no encontrado al reordenar.");
    }
    return { ...album, sortOrder: index };
  });
  await db.albums.bulkPut(updates);
}

export async function deleteAlbumCascade(albumId: string): Promise<void> {
  const db = getDb();
  const songs = await db.songs.where("albumId").equals(albumId).toArray();
  for (const song of songs) {
    await deleteSongCascade(song.id);
  }
  await db.albums.delete(albumId);
}
