import {
  DERIVED_MASTERY_CRITERION,
  MANUAL_MASTERY_CRITERIA,
  REQUIRED_SATISFACTORY_PERFORMANCES,
} from "@/domain/constants/mastery";
import type {
  MasteryCriterionId,
  PracticeSession,
  Song,
  SongMasteryCheck,
  SongStatus,
} from "@/domain/types";

function toCalendarDay(isoDate: string): string {
  return isoDate.slice(0, 10);
}

export function countSatisfactoryFullPerformancesOnDistinctDays(
  sessions: PracticeSession[],
): number {
  const days = new Set<string>();
  for (const session of sessions) {
    if (session.isSatisfactoryFullPerformance) {
      days.add(toCalendarDay(session.practicedAt));
    }
  }
  return days.size;
}

export function isDerivedCriterionSatisfied(
  sessions: PracticeSession[],
): boolean {
  return (
    countSatisfactoryFullPerformancesOnDistinctDays(sessions) >=
    REQUIRED_SATISFACTORY_PERFORMANCES
  );
}

export function areManualCriteriaComplete(
  checks: SongMasteryCheck[],
): boolean {
  const completed = new Set(
    checks.filter((c) => c.completed).map((c) => c.criterionId),
  );
  return MANUAL_MASTERY_CRITERIA.every((id) => completed.has(id));
}

export function evaluateMastery(
  checks: SongMasteryCheck[],
  sessions: PracticeSession[],
): boolean {
  return (
    areManualCriteriaComplete(checks) && isDerivedCriterionSatisfied(sessions)
  );
}

export function getCriterionCompletion(
  criterionId: MasteryCriterionId,
  checks: SongMasteryCheck[],
  sessions: PracticeSession[],
): boolean {
  if (criterionId === DERIVED_MASTERY_CRITERION) {
    return isDerivedCriterionSatisfied(sessions);
  }
  return checks.some((c) => c.criterionId === criterionId && c.completed);
}

export function resolveSongStatusAfterMasteryCheck(
  song: Song,
  checks: SongMasteryCheck[],
  sessions: PracticeSession[],
): SongStatus {
  if (evaluateMastery(checks, sessions)) {
    return "mastered";
  }
  if (song.status === "mastered") {
    return "in_progress";
  }
  return song.status;
}

/** Only this service decides the mastered status transition. */
export const SongMasteryService = {
  countSatisfactoryFullPerformancesOnDistinctDays,
  isDerivedCriterionSatisfied,
  areManualCriteriaComplete,
  evaluateMastery,
  getCriterionCompletion,
  resolveSongStatusAfterMasteryCheck,
} as const;
