import type { SemanticMemoryPort } from "./ports";

/**
 * Graceful degradation (PLAN §§44, 48 — acceptance of Phase 4):
 * semantic memory failure must NEVER break the product.
 *
 * - search → [] (the product continues with Postgres Human Context only)
 * - index → no-op (the document is simply not indexed)
 * The caller is notified via onError but never sees the exception.
 */
export function withGracefulDegradation(
  inner: SemanticMemoryPort,
  onError?: (error: unknown) => void,
): SemanticMemoryPort {
  return {
    async index(document) {
      try {
        await inner.index(document);
      } catch (error) {
        onError?.(error);
      }
    },
    async search(userId, query, limit) {
      try {
        return await inner.search(userId, query, limit);
      } catch (error) {
        onError?.(error);
        return [];
      }
    },
  };
}
