/**
 * Application: experience-selection (PLAN §§28, 32–34, 13).
 *
 * The custom-trained model is ONLY the Experience Selection Model (PLAN §14).
 * Everything behind this port is hidden from the rest of the app:
 *
 *   ExperienceSelectionModel
 *     └── ModelProvider (interface)
 *           ├── hosted inference (e.g. AI Gateway)
 *           ├── local inference
 *           └── fine-tuned Qwen candidate (Phase 12–13)
 *
 * The rest of the application must never know which implementation answers.
 * Output is always validated with ExperienceSelectionSchema
 * (src/shared/schemas/experience-selection.ts).
 *
 * Selection via general LLM lands in Phase 8; the fine-tuned model in Phase 13.
 */
export {};
