import type { Objective } from "../../domains/development/types.js";
import type {
  ExperienceAttempt,
  ExperienceRecommendation,
  ExperienceReport,
  ExperienceRisk,
} from "../../domains/experiences/types.js";

export interface ExperienceCandidate {
  experienceId: string;
  fit: number;
  risk: ExperienceRisk;
  reason: string;
}

export interface RecommendInput {
  userId: string;
  objectiveId: string;
  agentRunId: string;
  contextSnapshotId: string;
}

export interface DevelopmentDeps {
  listActiveObjectives: (userId: string) => Promise<Objective[]>;
  candidateExperiences: (
    objective: Objective,
  ) => Promise<ExperienceCandidate[]>;
  persistRecommendation: (r: ExperienceRecommendation) => Promise<void>;
  getRecommendation: (id: string) => Promise<ExperienceRecommendation | null>;
  updateRecommendation: (r: ExperienceRecommendation) => Promise<void>;
  persistAttempt: (a: ExperienceAttempt) => Promise<void>;
  getAttempt: (id: string) => Promise<ExperienceAttempt | null>;
  updateAttempt: (a: ExperienceAttempt) => Promise<void>;
  persistReport: (r: ExperienceReport) => Promise<void>;
  synthesizeReportText: (
    attempt: ExperienceAttempt,
    reflection?: Record<string, unknown>,
  ) => Promise<string>;
  recordReviewRequest: (attemptId: string) => Promise<void>;
  /** Routes the report content into the Human Context Engine as evidence. */
  submitEvidence: (userId: string, content: string) => Promise<void>;
}

export interface CompleteAttemptInput {
  attemptId: string;
  outcome: "completed" | "abandoned";
  reflection?: Record<string, unknown>;
}
