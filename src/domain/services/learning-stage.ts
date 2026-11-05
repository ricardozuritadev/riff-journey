import { LEARNING_STAGES } from "@/domain/constants/mastery";
import type { LearningStage, Song, SongStatus } from "@/domain/types";

export function canTransitionTo(
  from: LearningStage,
  to: LearningStage,
): boolean {
  const fromIndex = LEARNING_STAGES.indexOf(from);
  const toIndex = LEARNING_STAGES.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) {
    return false;
  }
  // Allow moving forward one step or revisiting previous stages.
  return toIndex <= fromIndex + 1;
}

export function nextStage(current: LearningStage): LearningStage | null {
  const index = LEARNING_STAGES.indexOf(current);
  if (index < 0 || index >= LEARNING_STAGES.length - 1) {
    return null;
  }
  return LEARNING_STAGES[index + 1] ?? null;
}

export function applyStageChange(
  song: Song,
  stage: LearningStage,
): Pick<Song, "learningStage" | "status"> {
  if (!canTransitionTo(song.learningStage, stage)) {
    throw new Error(
      `Transición de etapa no válida: ${song.learningStage} → ${stage}`,
    );
  }

  let status: SongStatus = song.status;
  if (song.status === "not_started") {
    status = "in_progress";
  }
  // Entering mastery stage does NOT auto-master the song.
  if (song.status === "mastered" && stage !== "mastery") {
    status = "in_progress";
  }

  return { learningStage: stage, status };
}

export const LearningStageService = {
  canTransitionTo,
  nextStage,
  applyStageChange,
} as const;
