/**
 * Ports: semantic memory (PLAN Phase 4).
 *
 * Supermemory is retrieval assistance, NEVER a source of truth
 * (Human Context lives in Postgres, PLAN §13).
 */
export interface MemoryDocument {
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryHit {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface SemanticMemoryPort {
  index(document: MemoryDocument): Promise<void>;
  search(userId: string, query: string, limit?: number): Promise<MemoryHit[]>;
}
