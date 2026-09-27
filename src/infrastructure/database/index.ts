/**
 * Infrastructure: database — Supabase Postgres (PLAN §§12, 42).
 *
 * PostgreSQL is the structured source of truth. Every Human Context
 * retrieval is user-scoped; RLS enforced (migrations in /supabase/migrations).
 */
export * from "./client";
