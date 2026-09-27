# Phase 3 — Human Context Engine (2026-09-27)

## Deliverables (PLAN §§24–26)

`src/application/human-context/`:

- **ports.ts**: `ClaimInterpreterPort` (LLM: relevance, claim proposals,
  semantic claim comparison), `HumanContextStore` (persistence boundary),
  `ProcessEvidenceInput`, `HumanContextEvent` union.
- **engine.ts**: `HumanContextEngine.processEvidence` implements the §24
  pipeline: validate evidence → relevance → retrieve claims → LLM
  interpretation → Zod-validated proposals → contradiction detection →
  deterministic rules → persist versions → snapshot when appropriate →
  domain events.
- Deterministic rules (§24 step 8): a `user_correction` source forces
  `user_confirmed` status (the user's own correction wins over inference).
- Contradiction engine (§26): new evidence vs existing claim → semantic
  comparison → `supports`/`contradicts`/`qualifies` link → **new claim
  version, never deletion**. A `major_update` snapshot is created when a
  claim is contradicted or user-confirmed.
- Async by design (§25): `processEvidence` is a promise the caller never
  blocks the conversation on.

## Verification

- TDD: `tests/human-context-engine.test.ts` (in-memory store + fake
  interpreter) — RED first, then GREEN.
- **Acceptance**: synthetic contradiction scenario — v1 ("Loves night
  walks", observed) is preserved byte-for-byte; v2 supersedes it with
  `user_confirmed`; `contradicts` link recorded; `major_update` snapshot
  references the new version. Irrelevant messages produce no claims.
- `tsc` clean, `biome check` clean, **29/29 tests**, `next build` green.
