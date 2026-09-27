# Phase 5 — Mind (2026-09-27)

## Deliverables (PLAN §§27–29)

`src/application/mind/`:

- **ports.ts**: `AgentType`, `MindEvent`, `IntentClassifier`, `SafetyChecker`,
  `AgentExecutor`, `AgentRunRecorder` (observability seam for `agent_runs`).
- **contracts.ts**: `AGENT_CONTRACTS` — per-agent responsibilities,
  forbidden responsibilities, allowed tools, allowed context (§28).
- **tools.ts**: `ToolRegistry` — every tool call is checked against the
  caller's contract; violations throw `ArchitectureError` (§29).
- **safety.ts**: `SafetyGate` — interception runs before the target agent.
- **mind.ts**: `Mind.dispatch` — event → routing → safety → agent → result,
  with run recording (start/end, failed runs recorded, never swallowed).

## Verification

- TDD: `tests/mind.test.ts` — RED first, then GREEN.
- **Acceptance**: companion can use `getRelevantHumanContext` but
  `updateDevelopmentPlan` and unknown tools throw `ArchitectureError` —
  no agent can bypass architectural boundaries. Safety-blocked events
  never reach the executor. Failed runs are recorded as failed.
- `tsc` clean, `biome check` clean, **39/39 tests**, `next build` green.
