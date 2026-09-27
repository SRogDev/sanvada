import { z } from "zod";

// PLAN §5 contract example — the canonical shape of an experience selection.
// Used for: agent outputs, LLM structured outputs, tool outputs, API outputs.
// Never trust raw LLM JSON: every selection is validated against this schema
// before it becomes an experience_recommendation row (PLAN §17, §32).

export const ExperienceSelectionSchema = z.object({
  experienceId: z.string().uuid(),
  reason: z.string(),
  targetCapability: z.string(),
  fit: z.number().min(0).max(1),
  risk: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
});

export type ExperienceSelection = z.infer<typeof ExperienceSelectionSchema>;
