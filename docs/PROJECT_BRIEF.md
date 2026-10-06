# sanvada — Project Brief

> Full project context in one file. Hand this to ANOTHER AI (GPT, etc.) for planning
> and ideation, then bring the refined specs back. Keep this file accurate — it is the handoff doc.
> For the current timeline see `STATUS.md`. For how to work in this repo see `AGENTS.md`.

## One-liner
Sanvada is Roger's conversational AI companion — a separate product from Polygrow.

## Problem & audience
People don't need another productivity assistant; they need something that makes them more capable of being themselves.

## Product (what it is / is not)
A conversational AI companion with its own product philosophy ('make people more capable of being themselves'). It is NOT a generic chatbot wrapper and NOT part of Polygrow.

## Key decisions (locked)
- Stack: Next.js + Vercel AI Elements + AI SDK + AI Gateway + Supabase + Supermemory.
- The app MVP intentionally avoids Python, FastAPI, LangGraph, and a VPS — those live only in the research track.
- Research LLM work in Python/Unsloth is separate from the app.

## Stack
Next.js 16, Vercel AI Elements, AI SDK, AI Gateway, Supabase (Postgres + Auth + RLS), Supermemory.

## Business model
Not locked yet.

## Open questions
- Supabase project setup is the current blocker (on Roger).
- Monetization and positioning vs. Polygrow still open.
