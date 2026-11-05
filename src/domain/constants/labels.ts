import type { ChallengeStatus, SongStatus } from "@/domain/types";

export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  not_started: "Sin empezar",
  in_progress: "En progreso",
  mastered: "Dominada",
};

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  not_started: "Sin empezar",
  active: "Activo",
  completed: "Completado",
  paused: "Pausado",
};

export const DIFFICULTY_LABELS = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
  expert: "Experta",
} as const;
