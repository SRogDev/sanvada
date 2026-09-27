import type {
  Claim,
  ClaimCategory,
  ClaimEvidence,
  ClaimEvidenceRelationship,
  ClaimStatus,
  ClaimVersion,
  Evidence,
  EvidenceSourceType,
  HumanContextSnapshot,
  RelevanceStatus,
} from "@/domains/human-context";
import type { UUID } from "@/shared/types";

/**
 * Ports: human-context engine (PLAN §§24–26).
 * The engine orchestrates; these boundaries are faked in tests and
 * implemented with real LLM/persistence in later phases.
 */

export interface ClaimWithVersions {
  claim: Claim;
  versions: ClaimVersion[];
}

export interface RelevanceAssessment {
  relevant: boolean;
  reason: string;
}

/** Raw LLM output for one claim proposal — validated by Zod at the boundary. */
export interface ClaimProposal {
  category: ClaimCategory;
  claimText: string;
  status: ClaimStatus;
  confidence: number;
  reason: string;
  /** Set when this proposal reinterprets an existing claim. */
  relatedClaimId: UUID | null;
}

export interface ClaimInterpreterPort {
  assessRelevance(evidence: Evidence): Promise<RelevanceAssessment>;
  proposeClaims(
    evidence: Evidence,
    relatedClaims: ClaimWithVersions[],
  ): Promise<ClaimProposal[]>;
  /** Semantic comparison for the contradiction engine (PLAN §26). */
  compareClaims(a: string, b: string): Promise<ClaimEvidenceRelationship>;
}

export interface HumanContextStore {
  saveEvidence(e: Evidence): Promise<void>;
  updateEvidenceRelevance(id: UUID, status: RelevanceStatus): Promise<void>;
  getClaimsByUser(userId: UUID): Promise<ClaimWithVersions[]>;
  saveClaim(c: Claim): Promise<void>;
  saveClaimVersion(v: ClaimVersion): Promise<void>;
  saveClaimEvidence(l: ClaimEvidence): Promise<void>;
  saveSnapshot(s: HumanContextSnapshot): Promise<void>;
  getLatestSnapshotVersion(userId: UUID): Promise<number>;
}

export interface ProcessEvidenceInput {
  userId: UUID;
  sourceType: EvidenceSourceType;
  sourceId?: UUID | null;
  content: string;
  structuredData?: Record<string, unknown> | null;
}

export type HumanContextEvent =
  | { type: "evidence_processed"; evidenceId: UUID }
  | { type: "evidence_irrelevant"; evidenceId: UUID; reason: string }
  | { type: "claim_created"; claimId: UUID; versionId: UUID }
  | {
      type: "claim_updated";
      claimId: UUID;
      versionId: UUID;
      relationship: ClaimEvidenceRelationship;
    }
  | { type: "snapshot_created"; snapshotId: UUID; version: number };
