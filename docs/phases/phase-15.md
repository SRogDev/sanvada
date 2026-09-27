# Phase 15 — Hardening (2026-09-27)

## Deliverables (PLAN §43)

- `src/infrastructure/security/rate-limit.ts`: `TokenBucket`
  (per-key limits, window refill; interface shaped for a Redis swap in
  multi-instance deployments).
- `src/app/api/chat/route.ts`:
  - Zod validation of the request body (1–50 messages, content ≤4000
    chars) → 400 on invalid.
  - Rate limit 20 req/min per client IP → 429 + `retry-after`.
  - Errors → safe 500, never stack traces or internals.
- `next.config.ts`: baseline security headers (nosniff, DENY framing,
  referrer policy, restrictive permissions policy).

## Verification

- TDD: `tests/hardening.test.ts` — RED first, then GREEN (6/6).
- Full suite: **70/70 tests**, `tsc` clean, `biome check` clean,
  `next build` green.
