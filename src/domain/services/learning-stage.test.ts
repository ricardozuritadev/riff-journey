import { describe, expect, it } from "vitest";
import { LearningStageService } from "@/domain/services/learning-stage";
import type { Song } from "@/domain/types";

const baseSong: Song = {
  id: "1",
  albumId: "a",
  title: "Song",
  trackNumber: 1,
  status: "not_started",
  learningStage: "learning",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("LearningStageService", () => {
  it("allows forward one step and revisiting previous stages", () => {
    expect(
      LearningStageService.canTransitionTo("learning", "consolidation"),
    ).toBe(true);
    expect(
      LearningStageService.canTransitionTo("consolidation", "learning"),
    ).toBe(true);
    expect(
      LearningStageService.canTransitionTo("learning", "full_performance"),
    ).toBe(false);
  });

  it("marks song in_progress when leaving not_started", () => {
    const result = LearningStageService.applyStageChange(
      baseSong,
      "consolidation",
    );
    expect(result.status).toBe("in_progress");
    expect(result.learningStage).toBe("consolidation");
  });

  it("does not auto-master when entering mastery stage", () => {
    const song: Song = {
      ...baseSong,
      status: "in_progress",
      learningStage: "full_performance",
    };
    const result = LearningStageService.applyStageChange(song, "mastery");
    expect(result.learningStage).toBe("mastery");
    expect(result.status).toBe("in_progress");
  });
});
