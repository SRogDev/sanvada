# Phase 6 — Companion (2026-09-27)

## Deliverables (PLAN §30)

`src/application/companion/`:

- **ports.ts**: `TextStreamPort` (LLM streaming seam), `SentientUIEvent`
  (`context_insight`, `experience_recommendation`, `self_map_update`,
  `reflection_prompt`), `ConversationEvidence`, `CompanionDeps`,
  `CompanionInput/Result`.
- **companion.ts**: `CompanionAgent.execute` —
  1. retrieve relevant human context (last user message as query),
  2. inject claims into the system prompt,
  3. stream the response through the port,
  4. emit contextual UI events for high-confidence claims,
  5. persist the conversation turn,
  6. kick off conversation-evidence recording **without blocking**
     the streamed response.
- `src/infrastructure/llm/ai-sdk-stream.ts`: real AI SDK 7 adapter
  (AI Gateway seam, swappable model id).

## Verification

- TDD: `tests/companion.test.ts` — RED first, then GREEN.
- **Acceptance**: a complete conversation streams end-to-end, context
  is retrieved and grounded into the prompt, UI events fire, and the
  conversation generates human-context evidence.
- `tsc` clean, `biome check` clean, **44/44 tests**, `next build` green.
