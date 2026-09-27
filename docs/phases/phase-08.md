# Phase 8 — Experiences: Selection Model (2026-09-27)

## Deliverables (PLAN §32)

`src/application/experience-selection/`:

- **ports.ts**: `ExperienceSelectionModel` contract — the only seam the
  rest of the app sees. `SelectionResult` carries `modelVersion` and an
  `inputHash` (sha256 of stable-serialized input).
- **model.ts**: `HeuristicSelectionModel` (`heuristic-1.0.0`) — transparent
  deterministic baseline:
  `score = 0.55·fit + 0.25·novelty − 0.2·riskPenalty`, ties break by id.
- **evaluation.ts**: `evaluateSelection` — fixed cases, hit@1 and MRR,
  per-case ranked lists. Reproducibility answers PLAN §17's
  "why was this exact experience recommended at this exact time?"

## Verification

- TDD: `tests/experience-selection.test.ts` — RED first, then GREEN.
- **Acceptance**: the model is swappable (stub satisfies the contract),
  deterministic (same input → same ranking + hash), and evaluable
  (heuristic scores hit@1=1.0 on the fixture; a reversed stub scores <1).
- `tsc` clean, `biome check` clean, **54/54 tests**, `next build` green.
