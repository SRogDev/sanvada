import { randomUUID } from "node:crypto";
import { ValidationError } from "@/shared/errors";
import type { UUID } from "@/shared/types";
import type {
  ExperienceAttempt,
  ExperienceAttemptStatus,
  ExperienceRecommendation,
  ExperienceRecommendationStatus,
  ExperienceReport,
  ExperienceRisk,
} from "./types";

/**
 * Domain logic: experiences (PLAN §§16–19).
 * Pure lifecycle transitions. The selection itself lives in the
 * ExperienceSelectionModel (application layer, Phase 8).
 */

function now(): string {
  return new Date().toISOString();
}

function requireUnitInterval(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ValidationError(`${field} must be within [0, 1].`);
  }
  return value;
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${field} must not be empty.`);
  return trimmed;
}

// --- Recommendation lifecycle (PLAN §17) --------------------------------------

export interface ProposeRecommendationInput {
  userId: UUID;
  experienceId: UUID;
  agentRunId: UUID;
  contextSnapshotId: UUID;
  reason: string;
  fit: number;
  risk: ExperienceRisk;
  confidence: number;
}

export function proposeRecommendation(
  input: ProposeRecommendationInput,
): ExperienceRecommendation {
  return {
    id: randomUUID(),
    userId: input.userId,
    experienceId: input.experienceId,
    agentRunId: input.agentRunId,
    contextSnapshotId: input.contextSnapshotId,
    reason: requireNonEmpty(input.reason, "reason"),
    fit: requireUnitInterval(input.fit, "fit"),
    risk: input.risk,
    confidence: requireUnitInterval(input.confidence, "confidence"),
    status: "proposed",
    createdAt: now(),
  };
}

type RecommendationResolution = "accepted" | "rejected" | "expired";

export function resolveRecommendation(
  recommendation: ExperienceRecommendation,
  resolution: RecommendationResolution,
): ExperienceRecommendation {
  if (recommendation.status !== "proposed") {
    throw new ValidationError(
      `Recommendation is already ${recommendation.status}; only proposed recommendations can be resolved.`,
    );
  }
  const status: ExperienceRecommendationStatus = resolution;
  return { ...recommendation, status };
}

// --- Attempt lifecycle (PLAN §18) ----------------------------------------------

export interface StartAttemptInput {
  userId: UUID;
  experienceId: UUID;
  recommendationId: UUID | null;
}

export function startAttempt(input: StartAttemptInput): ExperienceAttempt {
  const startedAt = now();
  return {
    id: randomUUID(),
    userId: input.userId,
    experienceId: input.experienceId,
    recommendationId: input.recommendationId,
    status: "started",
    startedAt,
    completedAt: null,
    createdAt: startedAt,
  };
}

type AttemptOutcome = "completed" | "abandoned";

export function finishAttempt(
  attempt: ExperienceAttempt,
  outcome: AttemptOutcome,
): ExperienceAttempt {
  if (attempt.status !== "started") {
    throw new ValidationError(
      `Attempt is already ${attempt.status}; only started attempts can finish.`,
    );
  }
  const status: ExperienceAttemptStatus = outcome;
  return { ...attempt, status, completedAt: now() };
}

// --- Report (PLAN §19): becomes evidence → Human Context Engine ------------------

export interface CreateReportInput {
  attempt: ExperienceAttempt;
  content: string;
  structuredReflection?: Record<string, unknown> | null;
}

export function createReport(input: CreateReportInput): ExperienceReport {
  if (input.attempt.status !== "completed") {
    throw new ValidationError(
      "A report requires a completed attempt; abandoned attempts produce no report.",
    );
  }
  return {
    id: randomUUID(),
    attemptId: input.attempt.id,
    content: requireNonEmpty(input.content, "content"),
    structuredReflection: input.structuredReflection ?? null,
    createdAt: now(),
  };
}
