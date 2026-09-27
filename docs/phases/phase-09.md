# Phase 9 — Sentient UI (2026-09-27)

## Deliverables (PLAN §33)

Design system first (ui-ux-pro-max): **Biomimetic / Organic 2.0** —
calm, introspective. Lora headings + Raleway body; bio red/blue +
vitality green palette; breathing presence animation; reduced-motion
respected; dark mode via CSS variables.

- `src/app/globals.css`: design tokens (`@theme`), fonts, `breathe`
  keyframes, `prefers-reduced-motion` support.
- `src/ui/shell.tsx`: sticky header with breathing brand mark, tab nav,
  demo badge (honest until Supabase is wired).
- `src/ui/chat-view.tsx`: streaming chat client — SSE from
  `/api/chat`, contextual insight cards from agent UI events,
  progressive rendering.
- `src/app/api/chat/route.ts`: `CompanionAgent` behind SSE; uses
  `AiSdkStreamPort` when `AI_GATEWAY_API_KEY` is set, otherwise a
  clearly-labeled `DemoStreamPort`.
- `src/app/self-map/page.tsx`: radial SVG claim visualization
  ("Así te veo") + confidence list. `src/app/experiences/page.tsx`:
  experience cards. `src/app/evolution/page.tsx`: snapshot timeline.
- `src/ui/sentient/events.ts`: **fixed event→card mapping** — unknown
  event types render nothing; the AI can never invent UI (§39).

## Verification

- TDD: `tests/sentient-ui.test.ts` — RED first, then GREEN (one test
  initially inverted vs. the design spec; fixed the test).
- Import convention fix: repo uses extensionless `@/` imports; the new
  UI files used `.js` and broke `next build` — normalized across `src/`.
- `tsc` clean, `biome check` clean, **58/58 tests**, `next build` green
  (7 routes: /, /chat, /self-map, /experiences, /evolution, /settings,
  /login + /api/chat).
