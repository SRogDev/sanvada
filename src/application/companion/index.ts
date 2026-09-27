/**
 * Application: companion — primary UX (PLAN §§28, 30).
 *
 * CAN: conversation · reflection · explain Human Context ·
 *       request relevant context.
 * CANNOT: directly mutate claims · bypass Safety ·
 *          modify database state arbitrarily.
 *
 * Tools: getRelevantHumanContext, createConversationEvidence (Zod-validated).
 * Streaming + Sentient UI events land in Phase 6.
 */

export * from "./companion.js";
export * from "./ports.js";
