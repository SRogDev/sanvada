/**
 * Application: understanding (docs/UNDERSTANDING.md).
 *
 * The integrable pipeline behind the future API product:
 *   INGEST (events → evidence) → MODEL (evidence → claims) → SELECT (ranked choice)
 *
 * Storage sits behind the UnderstandingStore port (in-memory today,
 * Supabase tomorrow). Claim extraction sits behind a versioned heuristic
 * today; the fine-tuned model registers here later. Nothing downstream
 * may depend on which implementation answers.
 */

export type EvidenceSourceType =
  | "conversation"
  | "experience_report"
  | "assessment"
  | "user_confirmation"
  | "user_correction"
  | "system_observation";

export interface EvidenceRecord {
  id: string;
  userId: string;
  sourceType: EvidenceSourceType;
  content: string;
  structuredData: Record<string, unknown> | null;
  createdAt: string;
}

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

export interface ClaimView {
  id: string;
  userId: string;
  category: ClaimCategory;
  text: string;
  confidence: number;
  status: ClaimStatus;
  evidenceCount: number;
  updatedAt: string;
}

/** Storage port — the API never touches a database directly. */
export interface UnderstandingStore {
  appendEvidence(
    records: Omit<EvidenceRecord, "id" | "createdAt">[],
  ): Promise<EvidenceRecord[]>;
  listEvidence(userId: string): Promise<EvidenceRecord[]>;
  listClaims(userId: string): Promise<ClaimView[]>;
  upsertClaims(claims: ClaimView[]): Promise<void>;
  /** Test seam: clear all state. */
  reset(): Promise<void>;
}
