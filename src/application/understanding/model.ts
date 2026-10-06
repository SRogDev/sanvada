import { randomUUID } from "node:crypto";
import type { ClaimView, UnderstandingStore } from "./ports";

/**
 * Heuristic MODEL step (v0 scaffold, clearly labeled).
 *
 * It does NOT pretend to understand: it groups a user's evidence by source
 * type and emits one low-confidence "uncertainty" claim per group. The
 * contract — a versioned list of confidence-scored claims — is what the
 * API sells; the fine-tuned extractor registers here later and must beat
 * this baseline on the sin/con API protocol (docs/UNDERSTANDING.md §4).
 */
export const UNDERSTAND_MODEL_VERSION = "understand-heuristic-0.1.0";
const HEURISTIC_CONFIDENCE = 0.3;

const SOURCE_LABEL: Record<string, string> = {
  conversation: "conversación",
  experience_report: "reportes de experiencia",
  assessment: "evaluaciones",
  user_confirmation: "confirmaciones del usuario",
  user_correction: "correcciones del usuario",
  system_observation: "observaciones del sistema",
};

export interface UnderstandResult {
  userId: string;
  modelVersion: string;
  claims: ClaimView[];
}

export async function understandUser(
  store: UnderstandingStore,
  userId: string,
): Promise<UnderstandResult> {
  const evidence = await store.listEvidence(userId);
  const now = new Date().toISOString();

  const bySource = new Map<string, typeof evidence>();
  for (const e of evidence) {
    const list = bySource.get(e.sourceType) ?? [];
    list.push(e);
    bySource.set(e.sourceType, list);
  }

  const claims: ClaimView[] = [...bySource.entries()].map(([source, list]) => ({
    id: randomUUID(),
    userId,
    category: "uncertainty" as const,
    text: `${list.length} señal(es) observada(s) vía ${SOURCE_LABEL[source] ?? source} — pendiente de interpretación por un modelo entrenado`,
    confidence: HEURISTIC_CONFIDENCE,
    status: "observed" as const,
    evidenceCount: list.length,
    updatedAt: now,
  }));

  await store.upsertClaims(claims);
  return { userId, modelVersion: UNDERSTAND_MODEL_VERSION, claims };
}
