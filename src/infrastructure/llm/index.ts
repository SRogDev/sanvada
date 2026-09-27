/**
 * Infrastructure: llm — provider abstractions (PLAN §§5, 33, 48).
 *
 * All LLM calls go through versioned model + prompt records
 * (model_versions / prompt_versions, PLAN §22). Structured outputs are
 * constrained by Zod schemas wherever the AI SDK allows it.
 *
 * If the LLM is unavailable → continue with a basic response (PLAN §48).
 */
export {};
