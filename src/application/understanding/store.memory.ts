import { randomUUID } from "node:crypto";
import type { ClaimView, EvidenceRecord, UnderstandingStore } from "./ports";

/**
 * In-memory UnderstandingStore. Correct for one process; the Supabase
 * implementation replaces it without touching the routes.
 */
export class MemoryUnderstandingStore implements UnderstandingStore {
  private evidence = new Map<string, EvidenceRecord[]>();
  private claims = new Map<string, ClaimView[]>();

  async appendEvidence(
    records: Omit<EvidenceRecord, "id" | "createdAt">[],
  ): Promise<EvidenceRecord[]> {
    const now = new Date().toISOString();
    const created = records.map((r) => ({
      ...r,
      id: randomUUID(),
      createdAt: now,
    }));
    for (const rec of created) {
      const list = this.evidence.get(rec.userId) ?? [];
      list.push(rec);
      this.evidence.set(rec.userId, list);
    }
    return created;
  }

  async listEvidence(userId: string): Promise<EvidenceRecord[]> {
    return [...(this.evidence.get(userId) ?? [])];
  }

  async listClaims(userId: string): Promise<ClaimView[]> {
    return [...(this.claims.get(userId) ?? [])];
  }

  async upsertClaims(claims: ClaimView[]): Promise<void> {
    for (const c of claims) {
      const list = this.claims.get(c.userId) ?? [];
      const idx = list.findIndex((x) => x.id === c.id);
      if (idx >= 0) list[idx] = c;
      else list.push(c);
      this.claims.set(c.userId, list);
    }
  }

  async reset(): Promise<void> {
    this.evidence.clear();
    this.claims.clear();
  }
}

/** Process-wide singleton; reset() is the test seam. */
let singleton: MemoryUnderstandingStore | null = null;

export function getUnderstandingStore(): UnderstandingStore {
  if (!singleton) singleton = new MemoryUnderstandingStore();
  return singleton;
}
