# Architecture decisions

Standing log. New decisions append here with date; nothing here overrides
PLAN.md — conflicts go through the Architectural Change Protocol (PLAN §52).

## 2026-09-27

### ADR-001 — Next.js server-side only, no Edge Functions
Supabase covers DB/Auth/Storage; all server logic lives in Next.js
server-side code. Edge Functions only if a concrete need appears.
(Rationale: PLAN principle 16 — simple enough for a solo developer.)

### ADR-002 — Tailwind CSS v4 as styling foundation
Not named in the plan, but AI Elements / Sentient UI need a styling system.
Recorded explicitly so it is not a silent addition. No component library
chosen yet — that decision lands with Phase 9 UI work.

### ADR-003 — Zod as first-class contract layer
Per PLAN §5: API/tool/agent/LLM I/O, env vars, dataset schemas, and
domain-boundary validation all go through Zod. `ai` SDK structured outputs
constrained by Zod wherever possible.

### ADR-004 — Vitest as test framework
Unit + contract + boundary tests in `tests/`. AI tests use versioned
fixtures (input → expected structured properties, never exact string match).
E2E tooling chosen in Phase 6.

### ADR-005 — Research Python via uv
When `research/` activates (Phase 10), it follows the repo Python
convention: `uv venv`, `pyproject.toml`, `uv sync`, committed `uv.lock`.

### ADR-006 — npm install needs --legacy-peer-deps
npm 10.9.4's arborist crashes (`Cannot read properties of null (reading
'edgesOut')`) resolving the vitest@4 peer graph. Workaround verified:
`npm install --legacy-peer-deps`.

## Deferred (explicitly not decided in Phase 0)

- **Background-job provider** for the async relevance → evidence → Human
  Context pipeline (Phase 4).
- **Voice**: first vertical slice is text chat → Human Context → Experience →
  Report; architecture stays voice-ready.
- **License**: Roger's call (other repos use MIT / Elastic 2.0).
