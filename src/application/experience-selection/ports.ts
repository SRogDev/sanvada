export type SelectionRisk = "low" | "medium" | "high";

export interface SelectionContext {
  userId: string;
  objectiveId: string;
  contextSnapshotId: string;
  agentRunId: string;
}

export interface SelectionCandidate {
  experienceId: string;
  /** Predicted developmental fit in [0, 1]. */
  fit: number;
  /** Novelty for this user in [0, 1]. */
  novelty: number;
  risk: SelectionRisk;
}

export interface SelectionResult {
  experienceId: string;
  score: number;
  rationale: string;
  modelVersion: string;
  /** sha256 of the stable-serialized selection input — reproducibility. */
  inputHash: string;
}

/**
 * The selection model contract (PLAN §§32, 14). The rest of the app only
 * sees this interface; Phase 12–13 put the fine-tuned Qwen behind it.
 */
export interface ExperienceSelectionModel {
  readonly modelVersion: string;
  select(
    context: SelectionContext,
    candidates: SelectionCandidate[],
  ): Promise<SelectionResult[]>;
}

export interface EvaluationCase {
  context: SelectionContext;
  candidates: SelectionCandidate[];
  expectedExperienceId: string;
}

export interface CaseEvaluation {
  contextSnapshotId: string;
  expectedExperienceId: string;
  rankedIds: string[];
  hitAt1: boolean;
  reciprocalRank: number;
}

export interface EvaluationReport {
  modelVersion: string;
  cases: number;
  hitAt1: number;
  mrr: number;
  results: CaseEvaluation[];
}
