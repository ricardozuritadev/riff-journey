import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDbInstanceForTests } from "@/data/db";
import { ensureSeedData } from "@/data/seed/run-seed";
import { SEED_IDS } from "@/data/seed/ids";

describe("ensureSeedData", () => {
  beforeEach(() => {
    resetDbInstanceForTests();
    indexedDB.deleteDatabase("riff-journey");
  });

  afterEach(async () => {
    const db = getDb();
    if (db.isOpen()) {
      db.close();
    }
    resetDbInstanceForTests();
    indexedDB.deleteDatabase("riff-journey");
  });

  it("seeds SUM 41 example data once", async () => {
    await ensureSeedData();
    const db = getDb();
    const band = await db.bands.get(SEED_IDS.bandSum41);
    const album = await db.albums.get(SEED_IDS.albumAllKiller);
    const song = await db.songs.get(SEED_IDS.songNothingOnMyBack);
    const techniques = await db.techniques.count();
    const settings = await db.app_settings.get("default");

    expect(band?.name).toBe("SUM 41");
    expect(album?.name).toBe("All Killer No Filler");
    expect(album?.releaseYear).toBe(2001);
    expect(song?.title).toBe("Nothing on My Back");
    expect(techniques).toBe(10);
    expect(settings?.activeBandId).toBe(SEED_IDS.bandSum41);
    expect(settings?.seedVersion).toBe(1);

    await ensureSeedData();
    expect(await db.bands.count()).toBe(1);
    expect(await db.songs.count()).toBe(1);
  });
});
