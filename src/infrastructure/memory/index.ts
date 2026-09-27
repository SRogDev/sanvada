/**
 * Infrastructure: memory — Supermemory adapter (PLAN §§13, 25, Phase 4).
 *
 * Supermemory is semantic memory / retrieval, NOT a competing source of
 * truth. Failure here must never break the product (PLAN §48):
 * `withGracefulDegradation` degrades search to [] and indexing to a no-op.
 */

export * from "./pipeline";
export * from "./ports";
export * from "./resilient-memory";
export * from "./supermemory-adapter";
