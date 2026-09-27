import type { ISODateString, UUID } from "@/shared/types";

/**
 * Domain: experiences (PLAN §§16–19).
 * There is deliberately NO difficulty field on Experience.
 */
export type ExperienceRisk = "low" | "medium" | "high";

export interface Experience {
  id: UUID;
  title: string;
  description: string;
  objective: string | null;
  targetCapabilities: string[];
  context: string | null;
  socialRequirement: string | null;
  emotionalIntensity: number | null;
  risk: ExperienceRisk;
  prerequisites: string[];
  estimatedDuration: string | null;
  constraints: string[];
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// PLAN §17: reproducibility — "why was this exact experience recommended
// at this exact time?" The agent_run_id + context_snapshot_id answer it.
export type ExperienceRecommendationStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "expired";

export interface ExperienceRecommendation {
  id: UUID;
  userId: UUID;
  experienceId: UUID;
  agentRunId: UUID;
  contextSnapshotId: UUID;
  reason: string;
  fit: number;
  risk: ExperienceRisk;
  confidence: number;
  status: ExperienceRecommendationStatus;
  createdAt: ISODateString;
}

export type ExperienceAttemptStatus = "started" | "completed" | "abandoned";

export interface ExperienceAttempt {
  id: UUID;
  userId: UUID;
  experienceId: UUID;
  recommendationId: UUID | null;
  status: ExperienceAttemptStatus;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
  createdAt: ISODateString;
}

// PLAN §19: the report becomes evidence → Human Context Engine.
export interface ExperienceReport {
  id: UUID;
  attemptId: UUID;
  content: string;
  structuredReflection: Record<string, unknown> | null;
  createdAt: ISODateString;
}
