import { getDb } from "@/data/db";
import { CURRENT_SEED_VERSION } from "@/data/seed/ids";
import type { AppSettings } from "@/domain/types";
import { nowIso } from "@/lib/dates";

export async function getSettings(): Promise<AppSettings | undefined> {
  return getDb().app_settings.get("default");
}

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await getSettings();
  if (existing) return existing;

  const timestamp = nowIso();
  const settings: AppSettings = {
    id: "default",
    seedVersion: 0,
    locale: "es",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await getDb().app_settings.put(settings);
  return settings;
}

export async function updateSettings(
  patch: Partial<Omit<AppSettings, "id">>,
): Promise<AppSettings> {
  const current = await ensureSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    id: "default",
    updatedAt: nowIso(),
  };
  await getDb().app_settings.put(next);
  return next;
}

export async function markSeedApplied(): Promise<void> {
  await updateSettings({ seedVersion: CURRENT_SEED_VERSION });
}
