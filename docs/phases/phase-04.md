# Phase 4 — Memory (2026-09-27)

## Deliverables (PLAN §50)

`src/infrastructure/memory/`:

- **ports.ts**: `SemanticMemoryPort` (`index`, `search`) — Supermemory is
  retrieval assistance, never a source of truth (Human Context lives in
  Postgres, PLAN §13).
- **supermemory-adapter.ts**: thin HTTP adapter (Supermemory v3,
  `x-api-key`, `/v3/documents`, `/v3/search`; base URL configurable).
  Documents are scoped per user via `sanvada:{userId}` container tags —
  semantic memory never leaks across users. Fail-fast
  `ProviderUnavailableError` when `SUPERMEMORY_API_KEY` is missing or the
  API errors.
- **resilient-memory.ts**: `withGracefulDegradation` — search degrades to
  `[]`, indexing degrades to a no-op; the caller is notified via `onError`
  but never sees the exception.
- **pipeline.ts**: `MemoryPipeline` — `enqueue()` returns immediately (the
  conversation never waits, PLAN §25); `drain()` processes sequentially; a
  failing document is recorded in `failed` and never blocks the rest.

## Verification

- TDD: `tests/memory.test.ts` — RED first, then GREEN.
- **Acceptance**: with a throwing provider, `search` resolves `[]` and
  `index` resolves without throwing — semantic memory failure does not
  break the product.
- `tsc` clean, `biome check` clean, **34/34 tests**.
