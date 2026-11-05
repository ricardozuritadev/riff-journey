import { getDb } from "@/data/db";
import { BandChallengeService } from "@/domain/services/band-challenge";
import type { Band, SongStatus } from "@/domain/types";
import { createId } from "@/lib/id";
import { nowIso } from "@/lib/dates";
import { updateSettings } from "@/data/repositories/settings-repository";
import { deleteAlbumCascade } from "@/data/repositories/album-repository";

export async function listBands(): Promise<Band[]> {
  return getDb().bands.orderBy("createdAt").reverse().toArray();
}

export async function getBand(id: string): Promise<Band | undefined> {
  return getDb().bands.get(id);
}

export async function createBand(input: {
  name: string;
  description?: string;
  artworkUrl?: string;
}): Promise<Band> {
  const band: Band = {
    id: createId(),
    name: input.name,
    description: input.description || undefined,
    artworkUrl: input.artworkUrl || undefined,
    createdAt: nowIso(),
    challengeStatus: "not_started",
  };
  await getDb().bands.add(band);
  return band;
}

export async function updateBand(
  id: string,
  patch: Partial<Pick<Band, "name" | "description" | "artworkUrl">>,
): Promise<Band> {
  const existing = await getBand(id);
  if (!existing) {
    throw new Error("Banda no encontrada.");
  }
  const next: Band = {
    ...existing,
    ...patch,
    description: patch.description === "" ? undefined : patch.description ?? existing.description,
    artworkUrl: patch.artworkUrl === "" ? undefined : patch.artworkUrl ?? existing.artworkUrl,
  };
  await getDb().bands.put(next);
  return next;
}

export async function deleteBandCascade(bandId: string): Promise<void> {
  const db = getDb();
  const albums = await db.albums.where("bandId").equals(bandId).toArray();
  for (const album of albums) {
    await deleteAlbumCascade(album.id);
  }
  await db.bands.delete(bandId);

  const settings = await db.app_settings.get("default");
  if (settings?.activeBandId === bandId) {
    await updateSettings({ activeBandId: undefined });
  }
}

export async function setActiveBand(bandId: string): Promise<void> {
  const db = getDb();
  const bands = await db.bands.toArray();
  const target = bands.find((b) => b.id === bandId);
  if (!target) {
    throw new Error("Banda no encontrada.");
  }

  const updated = BandChallengeService.prepareActivateChallenge(
    bands,
    bandId,
    nowIso(),
  );

  await db.transaction("rw", db.bands, db.app_settings, async () => {
    await db.bands.bulkPut(updated);
    await updateSettings({ activeBandId: bandId });
  });
}

export async function pauseActiveBand(bandId: string): Promise<Band> {
  const band = await getBand(bandId);
  if (!band) {
    throw new Error("Banda no encontrada.");
  }
  const next = BandChallengeService.preparePauseChallenge(band);
  await getDb().bands.put(next);
  await updateSettings({ activeBandId: undefined });
  return next;
}

export async function completeBandChallenge(
  bandId: string,
  songs: Array<{ status: SongStatus }>,
): Promise<Band> {
  const band = await getBand(bandId);
  if (!band) {
    throw new Error("Banda no encontrada.");
  }
  const progress = BandChallengeService.calculateBandProgress(
    songs.map((s, index) => ({
      id: `tmp-${index}`,
      albumId: "tmp",
      title: "",
      trackNumber: index + 1,
      status: s.status,
      learningStage: "learning" as const,
      createdAt: nowIso(),
    })),
  );
  const next = BandChallengeService.prepareCompleteChallenge(
    band,
    progress,
    nowIso(),
  );
  await getDb().bands.put(next);
  return next;
}
