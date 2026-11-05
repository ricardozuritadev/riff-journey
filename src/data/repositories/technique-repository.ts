import { getDb } from "@/data/db";
import type { Technique } from "@/domain/types";

export async function listTechniques(): Promise<Technique[]> {
  return getDb().techniques.orderBy("name").toArray();
}

export async function getTechniquesByIds(ids: string[]): Promise<Technique[]> {
  if (ids.length === 0) return [];
  const all = await getDb().techniques.bulkGet(ids);
  return all.filter((t): t is Technique => t !== undefined);
}
