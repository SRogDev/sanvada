import { createHash } from "node:crypto";
import type {
  ExperienceSelectionModel,
  SelectionCandidate,
  SelectionContext,
  SelectionResult,
  SelectionRisk,
} from "./ports.js";

const RISK_PENALTY: Record<SelectionRisk, number> = {
  low: 0,
  medium: 0.15,
  high: 0.35,
};

/** Deterministic scoring weights — versioned with the model. */
const WEIGHTS = { fit: 0.55, novelty: 0.25, risk: 0.2 } as const;

function stableSerialize(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : 1,
          ),
        )
      : v,
  );
}

export function hashSelectionInput(
  context: SelectionContext,
  candidates: SelectionCandidate[],
): string {
  return createHash("sha256")
    .update(stableSerialize({ context, candidates }))
    .digest("hex");
}

/**
 * Heuristic selection model (PLAN §32): transparent baseline behind the
 * same contract the fine-tuned model will satisfy in Phase 13.
 * score = w_fit·fit + w_novelty·novelty − w_risk·riskPenalty.
 * Ties break by experienceId — fully deterministic.
 */
export class HeuristicSelectionModel implements ExperienceSelectionModel {
  readonly modelVersion = "heuristic-1.0.0";

  async select(
    context: SelectionContext,
    candidates: SelectionCandidate[],
  ): Promise<SelectionResult[]> {
    const inputHash = hashSelectionInput(context, candidates);
    const scored = candidates.map((c) => {
      const score =
        WEIGHTS.fit * c.fit +
        WEIGHTS.novelty * c.novelty -
        WEIGHTS.risk * RISK_PENALTY[c.risk];
      return {
        experienceId: c.experienceId,
        score,
        rationale:
          `fit=${c.fit.toFixed(2)} novelty=${c.novelty.toFixed(2)} risk=${c.risk} ` +
          `(penalty ${RISK_PENALTY[c.risk].toFixed(2)})`,
        modelVersion: this.modelVersion,
        inputHash,
      };
    });
    scored.sort(
      (a, b) => b.score - a.score || (a.experienceId < b.experienceId ? -1 : 1),
    );
    return scored;
  }
}
