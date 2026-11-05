export type LearningStage =
  | "learning"
  | "consolidation"
  | "full_performance"
  | "mastery";

export type SongStatus = "not_started" | "in_progress" | "mastered";

export type ChallengeStatus =
  | "not_started"
  | "active"
  | "completed"
  | "paused";

export type MasteryCriterionId =
  | "knows_structure"
  | "plays_every_section"
  | "clean_transitions"
  | "original_tempo"
  | "without_tabs"
  | "two_satisfactory_performances";

export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

export interface Band {
  id: string;
  name: string;
  description?: string;
  artworkUrl?: string;
  createdAt: string;
  challengeStartedAt?: string;
  challengeCompletedAt?: string;
  challengeStatus: ChallengeStatus;
}

export interface Album {
  id: string;
  bandId: string;
  name: string;
  releaseYear: number;
  sortOrder: number;
  artworkUrl?: string;
  description?: string;
}

export interface Song {
  id: string;
  albumId: string;
  title: string;
  trackNumber: number;
  durationSeconds?: number;
  tuning?: string;
  targetBpm?: number;
  difficulty?: DifficultyLevel;
  notes?: string;
  status: SongStatus;
  learningStage: LearningStage;
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  songId: string;
  practicedAt: string;
  durationMinutes: number;
  stage: LearningStage;
  bpmAchieved?: number;
  notes?: string;
  difficultSections?: string;
  techniquesPracticed: string[];
  isSatisfactoryFullPerformance: boolean;
}

export interface SongMasteryCheck {
  id: string;
  songId: string;
  criterionId: MasteryCriterionId;
  completed: boolean;
  completedAt?: string;
}

export interface Technique {
  id: string;
  slug: string;
  name: string;
}

export interface SongTechnique {
  id: string;
  songId: string;
  techniqueId: string;
}

export interface AppSettings {
  id: "default";
  activeBandId?: string;
  seedVersion: number;
  locale: "es";
  createdAt: string;
  updatedAt: string;
}

export interface MasteryCriterionDefinition {
  id: MasteryCriterionId;
  label: string;
  description: string;
  derived: boolean;
}

export interface BandProgress {
  totalSongs: number;
  masteredSongs: number;
  inProgressSongs: number;
  percent: number;
}

export interface DashboardStats {
  masteredSongs: number;
  inProgressSongs: number;
  totalPracticeMinutes: number;
  overallProgressPercent: number;
}

export interface AppStats {
  masteredSongs: number;
  inProgressSongs: number;
  totalPracticeMinutes: number;
  averageSessionMinutes: number;
  masteredPerMonth: Array<{ month: string; count: number }>;
  progressByBand: Array<{
    bandId: string;
    bandName: string;
    percent: number;
    mastered: number;
    total: number;
  }>;
  practiceActivity: Array<{ date: string; minutes: number }>;
  topTechniques: Array<{ techniqueId: string; name: string; count: number }>;
}
