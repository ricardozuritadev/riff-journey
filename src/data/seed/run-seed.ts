import { getDb } from "@/data/db";
import { CURRENT_SEED_VERSION } from "@/data/seed/ids";
import { buildSum41Seed } from "@/data/seed/sum41";
import { ensureSettings, markSeedApplied } from "@/data/repositories/settings-repository";

export async function ensureSeedData(): Promise<void> {
  const db = getDb();
  const settings = await ensureSettings();

  if (settings.seedVersion >= CURRENT_SEED_VERSION) {
    return;
  }

  const bandCount = await db.bands.count();
  if (bandCount > 0) {
    // User already has data; just bump seed version without re-inserting.
    await markSeedApplied();
    return;
  }

  const seed = buildSum41Seed();

  await db.transaction(
    "rw",
    [
      db.bands,
      db.albums,
      db.songs,
      db.song_mastery_checks,
      db.techniques,
      db.app_settings,
    ],
    async () => {
      await db.techniques.bulkPut(seed.techniques);
      await db.bands.put(seed.band);
      await db.albums.put(seed.album);
      await db.songs.put(seed.song);
      await db.song_mastery_checks.bulkPut(seed.checks);
      await db.app_settings.put(seed.settings);
    },
  );
}
