/**
 * Infrastructure: memory — Supermemory adapter (PLAN §§13, 25).
 *
 * Supermemory is semantic memory / retrieval, NOT a competing source of
 * truth. Failure here must never break the product (PLAN §48):
 * continue without semantic memory.
 *
 * Adapter + async indexing pipeline land in Phase 4.
 */
export {};
