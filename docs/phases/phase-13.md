# Phase 13 — Production Model (2026-09-27)

## Deliverables (PLAN §41)

`src/infrastructure/llm/selection-model.ts`:

- `GatewaySelectionModel` implements `ExperienceSelectionModel`
  (`gateway-1.0.0`) — structured output via AI Gateway, validated with
  `ExperienceSelectionSchema`; unknown experience ids are rejected.
  **Never trusts raw LLM JSON.**
- `resolveSelectionModel()` — the only way the app obtains a selection
  model. `SELECTION_MODEL=gateway` selects the gateway model;
  default is the heuristic. The fine-tuned Qwen registers as another
  branch here — nothing else in the app changes.

## Verification

- TDD: `tests/selection-model.test.ts` — RED first, then GREEN.
- **Acceptance**: production selection stays behind the
  `ExperienceSelectionModel` contract; invalid/unknown-id outputs throw.
- `tsc` clean, `biome check` clean, **64/64 tests**, `next build` green.
