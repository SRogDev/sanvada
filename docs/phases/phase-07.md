# Phase 7 — Development (2026-09-27)

## Deliverables (PLAN §31)

`src/application/development/`:

- **ports.ts**: `DevelopmentDeps` — objective listing, candidate
  experiences, recommendation/attempt/report persistence, report
  synthesis, review requests, evidence submission into the Human
  Context Engine.
- **development.ts**: `DevelopmentAgent` —
  1. `recommendForObjective`: active objective → candidates → domain
     `proposeRecommendation` (persisted as `proposed`),
  2. `acceptRecommendation`: `resolveRecommendation(accepted)` +
     domain `startAttempt` (attempt `started`),
  3. `completeAttempt`: domain `finishAttempt` → report synthesis →
     domain `createReport` → evidence submitted to Human Context
     (abandoned attempts produce no report — domain invariant),
  4. `requestReview`: records a review request for the safety loop.

## Verification

- TDD: `tests/development.test.ts` — RED first, then GREEN.
- **Acceptance**: full flow propose → accept → complete → report →
  evidence works; double-completion is rejected.
- `tsc` clean, `biome check` clean, **49/49 tests**, `next build` green.
