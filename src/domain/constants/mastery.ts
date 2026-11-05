import type {
  LearningStage,
  MasteryCriterionDefinition,
  MasteryCriterionId,
} from "@/domain/types";

export const LEARNING_STAGES: LearningStage[] = [
  "learning",
  "consolidation",
  "full_performance",
  "mastery",
];

export const LEARNING_STAGE_LABELS: Record<LearningStage, string> = {
  learning: "Aprendizaje",
  consolidation: "Consolidación",
  full_performance: "Interpretación completa",
  mastery: "Dominio",
};

export const MASTERY_CRITERIA: MasteryCriterionDefinition[] = [
  {
    id: "knows_structure",
    label: "Conoce la estructura completa",
    description: "Entiende todas las secciones de la canción y su orden.",
    derived: false,
  },
  {
    id: "plays_every_section",
    label: "Toca cada sección sin saltarse nada",
    description: "Puede tocar todas las partes de la canción.",
    derived: false,
  },
  {
    id: "clean_transitions",
    label: "Transiciones limpias",
    description: "Pasa entre secciones sin detenerse.",
    derived: false,
  },
  {
    id: "original_tempo",
    label: "Tempo original",
    description: "Puede tocar al tempo original de la grabación.",
    derived: false,
  },
  {
    id: "without_tabs",
    label: "Sin depender de tabs",
    description: "Toca sin mirar tabs constantemente.",
    derived: false,
  },
  {
    id: "two_satisfactory_performances",
    label: "Dos interpretaciones satisfactorias",
    description:
      "Al menos dos interpretaciones completas satisfactorias en días distintos.",
    derived: true,
  },
];

export const MANUAL_MASTERY_CRITERIA: MasteryCriterionId[] =
  MASTERY_CRITERIA.filter((c) => !c.derived).map((c) => c.id);

export const DERIVED_MASTERY_CRITERION: MasteryCriterionId =
  "two_satisfactory_performances";

export const REQUIRED_SATISFACTORY_PERFORMANCES = 2;
