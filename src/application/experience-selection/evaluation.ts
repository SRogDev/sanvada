import type {
  CaseEvaluation,
  EvaluationCase,
  EvaluationReport,
  ExperienceSelectionModel,
} from "./ports.js";

/**
 * Reproducible evaluation (PLAN §32): fixed cases, deterministic metrics.
 * Answers "why was this exact experience recommended at this exact time?"
 * together with the inputHash on every SelectionResult.
 */
export async function evaluateSelection(
  model: ExperienceSelectionModel,
  cases: EvaluationCase[],
): Promise<EvaluationReport> {
  const results: CaseEvaluation[] = [];
  for (const c of cases) {
    const ranked = await model.select(c.context, c.candidates);
    const rankedIds = ranked.map((r) => r.experienceId);
    const rank = rankedIds.indexOf(c.expectedExperienceId);
    results.push({
      contextSnapshotId: c.context.contextSnapshotId,
      expectedExperienceId: c.expectedExperienceId,
      rankedIds,
      hitAt1: rank === 0,
      reciprocalRank: rank >= 0 ? 1 / (rank + 1) : 0,
    });
  }
  const n = results.length;
  return {
    modelVersion: model.modelVersion,
    cases: n,
    hitAt1: n === 0 ? 0 : results.filter((r) => r.hitAt1).length / n,
    mrr: n === 0 ? 0 : results.reduce((s, r) => s + r.reciprocalRank, 0) / n,
    results,
  };
}
