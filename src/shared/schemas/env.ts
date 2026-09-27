import { z } from "zod";

// PLAN §5: environment variables are validated with Zod at the boundary.
// Every variable stays optional until its phase lands, so `vitest run` and
// `next build` work with an empty environment in CI. Runtime code must call
// getEnv() and fail fast with a clear message when a phase needs a missing var.

export const envSchema = z.object({
  // Phase 1: Supabase Auth + Postgres + RLS
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // LLM inference. Provider-abstracted behind the ModelProvider port
  // (src/application/experience-selection/); Vercel AI Gateway is the
  // default seam. Nothing here hard-codes a model vendor (PLAN §2, §13).
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),

  // Phase 4: semantic memory / retrieval. Never a source of truth (PLAN §13).
  SUPERMEMORY_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
