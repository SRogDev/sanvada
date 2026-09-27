# Phase 2 — Domain Layer (2026-09-27)

## Deliverables (PLAN §50)

Pure domain logic in `src/domains/*/logic.ts` (no I/O, no LLM, no persistence;
inputs never mutated). Re-exported from each domain `index.ts`.

- **human-context/logic.ts** (§§9–13): `createEvidence` (starts `pending`,
  trims, rejects empty), `transitionEvidenceRelevance` (legal transitions
  only: pending→relevant|irrelevant, relevant→processed), `openClaim`
  (claim + first version, `supersedesVersionId: null`), `applyClaimVersion`
  (new version supersedes latest; history never mutated; claim's current
  status/confidence follow the latest version), `buildSnapshot` (references
  version IDs, never duplicates).
- **experiences/logic.ts** (§§16–19): `proposeRecommendation` (starts
  `proposed`; fit/confidence validated in [0,1]), `resolveRecommendation`
  (proposed→accepted|rejected|expired, once), `startAttempt`/`finishAttempt`
  (started→completed|abandoned), `createReport` (requires a completed
  attempt — abandoned attempts produce no report).
- **development/logic.ts** (§§14–15): objectives, plans and plan items with
  guarded transitions (active↔paused, terminal completed/archived; items
  proposed→active→completed|dropped).

## Verification

- TDD: 3 new test files written first (RED: module-not-found), then
  implemented (GREEN).
- `tsc` clean, `biome check` clean, **26/26 tests**, `next build` green.
- Architecture boundary test still green (domains import nothing forbidden).

## Acceptance

Domain tests pass independently — yes, `tests/domain-*.test.ts` run with no
infrastructure.
