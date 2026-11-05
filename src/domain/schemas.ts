import { z } from "zod";

export const learningStageSchema = z.enum([
  "learning",
  "consolidation",
  "full_performance",
  "mastery",
]);

export const songStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "mastered",
]);

export const challengeStatusSchema = z.enum([
  "not_started",
  "active",
  "completed",
  "paused",
]);

export const masteryCriterionIdSchema = z.enum([
  "knows_structure",
  "plays_every_section",
  "clean_transitions",
  "original_tempo",
  "without_tabs",
  "two_satisfactory_performances",
]);

export const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);

export const bandFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  artworkUrl: z.string().trim().url("URL no válida").optional().or(z.literal("")),
});

export const albumFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  releaseYear: z.coerce
    .number()
    .int()
    .min(1900, "Año no válido")
    .max(2100, "Año no válido"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  artworkUrl: z.string().trim().url("URL no válida").optional().or(z.literal("")),
});

export const songFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(160),
  trackNumber: z.coerce.number().int().min(1, "Número de pista no válido"),
  durationSeconds: z.coerce.number().int().min(1).optional().or(z.nan()).transform((v) =>
    Number.isNaN(v) ? undefined : v,
  ),
  tuning: z.string().trim().max(40).optional().or(z.literal("")),
  targetBpm: z.coerce.number().int().min(40).max(300).optional().or(z.nan()).transform((v) =>
    Number.isNaN(v) ? undefined : v,
  ),
  difficulty: difficultySchema.optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const practiceSessionFormSchema = z.object({
  songId: z.string().uuid("Canción no válida"),
  practicedAt: z.string().min(1, "La fecha es obligatoria"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Mínimo 1 minuto")
    .max(600, "Máximo 600 minutos"),
  stage: learningStageSchema,
  bpmAchieved: z.coerce.number().int().min(40).max(300).optional().or(z.nan()).transform((v) =>
    Number.isNaN(v) ? undefined : v,
  ),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  difficultSections: z.string().trim().max(1000).optional().or(z.literal("")),
  techniquesPracticed: z.array(z.string().uuid()).default([]),
  isSatisfactoryFullPerformance: z.boolean().default(false),
});

export type BandFormValues = z.infer<typeof bandFormSchema>;
export type AlbumFormValues = z.infer<typeof albumFormSchema>;
export type SongFormValues = z.infer<typeof songFormSchema>;
export type PracticeSessionFormValues = z.infer<
  typeof practiceSessionFormSchema
>;
