import { randomUUID } from "node:crypto";
import { ValidationError } from "@/shared/errors";
import type { UUID } from "@/shared/types";
import type {
  Claim,
  ClaimCategory,
  ClaimStatus,
  ClaimVersion,
  Evidence,
  EvidenceSourceType,
  HumanContextSnapshot,
  RelevanceStatus,
  SnapshotTrigger,
} from "./types";

/**
 * Domain logic: human-context (PLAN §§9–13).
 * Pure functions. No I/O, no LLM, no persistence — the HumanContextEngine
 * (Phase 3) orchestrates these. Inputs are never mutated.
 */

function now(): string {
  return new Date().toISOString();
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${field} must not be empty.`);
  return trimmed;
}

function requireUnitInterval(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ValidationError(`${field} must be within [0, 1].`);
  }
  return value;
}

// --- Evidence (PLAN §9): immutable -------------------------------------------

export interface CreateEvidenceInput {
  userId: UUID;
  sourceType: EvidenceSourceType;
  sourceId?: UUID | null;
  content: string;
  structuredData?: Record<string, unknown> | null;
}

export function createEvidence(input: CreateEvidenceInput): Evidence {
  return {
    id: randomUUID(),
    userId: input.userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? null,
    content: requireNonEmpty(input.content, "content"),
    structuredData: input.structuredData ?? null,
    relevanceStatus: "pending",
    createdAt: now(),
  };
}

const RELEVANCE_TRANSITIONS: Record<RelevanceStatus, RelevanceStatus[]> = {
  pending: ["relevant", "irrelevant"],
  relevant: ["processed"],
  irrelevant: [],
  processed: [],
};

export function transitionEvidenceRelevance(
  evidence: Evidence,
  to: RelevanceStatus,
): Evidence {
  if (!RELEVANCE_TRANSITIONS[evidence.relevanceStatus].includes(to)) {
    throw new ValidationError(
      `Illegal relevance transition: ${evidence.relevanceStatus} → ${to}.`,
    );
  }
  return { ...evidence, relevanceStatus: to };
}

// --- Claims (PLAN §§10–11): history is never overwritten ----------------------

export interface OpenClaimInput {
  userId: UUID;
  category: ClaimCategory;
  claimText: string;
  status: ClaimStatus;
  confidence: number;
  reason?: string | null;
}

export function openClaim(input: OpenClaimInput): {
  claim: Claim;
  version: ClaimVersion;
} {
  const claim: Claim = {
    id: randomUUID(),
    userId: input.userId,
    category: input.category,
    currentStatus: input.status,
    currentConfidence: requireUnitInterval(input.confidence, "confidence"),
    createdAt: now(),
    updatedAt: now(),
  };
  const version: ClaimVersion = {
    id: randomUUID(),
    claimId: claim.id,
    claimText: requireNonEmpty(input.claimText, "claimText"),
    status: input.status,
    confidence: claim.currentConfidence,
    reason: input.reason ?? null,
    createdAt: now(),
    supersedesVersionId: null,
  };
  return { claim, version };
}

export interface ClaimVersionProposal {
  claimText: string;
  status: ClaimStatus;
  confidence: number;
  reason?: string | null;
}

export function applyClaimVersion(
  claim: Claim,
  latestVersion: ClaimVersion,
  proposal: ClaimVersionProposal,
): { claim: Claim; version: ClaimVersion } {
  if (latestVersion.claimId !== claim.id) {
    throw new ValidationError("Version does not belong to this claim.");
  }
  const version: ClaimVersion = {
    id: randomUUID(),
    claimId: claim.id,
    claimText: requireNonEmpty(proposal.claimText, "claimText"),
    status: proposal.status,
    confidence: requireUnitInterval(proposal.confidence, "confidence"),
    reason: proposal.reason ?? null,
    createdAt: now(),
    supersedesVersionId: latestVersion.id,
  };
  const updated: Claim = {
    ...claim,
    currentStatus: version.status,
    currentConfidence: version.confidence,
    updatedAt: now(),
  };
  return { claim: updated, version };
}

// --- Snapshots (PLAN §13): reference versions, never duplicate ----------------

export interface BuildSnapshotInput {
  userId: UUID;
  version: number;
  claimVersionIds: UUID[];
  trigger: SnapshotTrigger;
}

export function buildSnapshot(input: BuildSnapshotInput): HumanContextSnapshot {
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new ValidationError("Snapshot version must be a positive integer.");
  }
  return {
    id: randomUUID(),
    userId: input.userId,
    version: input.version,
    snapshotData: { claimVersions: [...input.claimVersionIds] },
    createdAt: now(),
    trigger: input.trigger,
  };
}
