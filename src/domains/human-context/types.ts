import type { ISODateString, UUID } from "@/shared/types";

/**
 * Domain: human-context (PLAN §§9–13).
 *
 * The core chain: Evidence → Claim → ClaimVersion → HumanContextSnapshot.
 * There is deliberately NO single human_context table with everything.
 */

// --- Evidence (PLAN §9): immutable. If interpretation changes, the evidence remains.
export type EvidenceSourceType =
  | "conversation"
  | "experience_report"
  | "assessment"
  | "user_confirmation"
  | "user_correction"
  | "system_observation";

export type RelevanceStatus =
  | "pending"
  | "relevant"
  | "irrelevant"
  | "processed";

export interface Evidence {
  id: UUID;
  userId: UUID;
  sourceType: EvidenceSourceType;
  sourceId: UUID | null;
  content: string;
  structuredData: Record<string, unknown> | null;
  relevanceStatus: RelevanceStatus;
  createdAt: ISODateString;
}

// --- Claims (PLAN §10): enduring propositions about the user.
export type ClaimCategory =
  | "personality"
  | "preference"
  | "value"
  | "interest"
  | "experience"
  | "capability"
  | "behavior_pattern"
  | "emotional_pattern"
  | "social_pattern"
  | "uncertainty";

export type ClaimStatus =
  | "observed"
  | "inferred"
  | "user_confirmed"
  | "user_rejected"
  | "contradicted"
  | "outdated";

export interface Claim {
  id: UUID;
  userId: UUID;
  category: ClaimCategory;
  currentStatus: ClaimStatus;
  currentConfidence: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// --- Claim versions (PLAN §11): historical interpretations are NEVER overwritten.
export interface ClaimVersion {
  id: UUID;
  claimId: UUID;
  claimText: string;
  status: ClaimStatus;
  confidence: number;
  reason: string | null;
  createdAt: ISODateString;
  supersedesVersionId: UUID | null;
}

// --- Claim ↔ evidence (PLAN §12): answers "why do you think this about me?"
export type ClaimEvidenceRelationship =
  | "supports"
  | "contradicts"
  | "qualifies";

export interface ClaimEvidence {
  claimId: UUID;
  evidenceId: UUID;
  relationship: ClaimEvidenceRelationship;
  createdAt: ISODateString;
}

// --- Snapshots (PLAN §13): reference/version claims, never duplicate them.
export type SnapshotTrigger =
  | "major_update"
  | "experience"
  | "user_review"
  | "scheduled"
  | "manual";

export interface HumanContextSnapshot {
  id: UUID;
  userId: UUID;
  version: number;
  snapshotData: {
    claimVersions: UUID[];
  };
  createdAt: ISODateString;
  trigger: SnapshotTrigger;
}
