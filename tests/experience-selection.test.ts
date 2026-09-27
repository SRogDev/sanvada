/**
 * Phase 8 — Experiences: selection model (PLAN §32).
 *
 * Swappable ExperienceSelectionModel behind a stable contract,
 * plus reproducible evaluation infrastructure.
 *
 * Acceptance: the selection model is swappable and every selection
 * is reproducible (input hash + model version recorded).
 */
import { describe, expect, it } from "vitest";
import { evaluateSelection } from "../src/application/experience-selection/evaluation.js";
import { HeuristicSelectionModel } from "../src/application/experience-selection/model.js";
import type {
  EvaluationCase,
  ExperienceSelectionModel,
  SelectionCandidate,
  SelectionContext,
} from "../src/application/experience-selection/ports.js";

const context: SelectionContext = {
  userId: "u1",
  objectiveId: "obj-1",
  contextSnapshotId: "snap-1",
  agentRunId: "run-1",
};

const candidates: SelectionCandidate[] = [
  { experienceId: "exp-risky", fit: 0.9, novelty: 0.2, risk: "high" },
  { experienceId: "exp-best", fit: 0.85, novelty: 0.8, risk: "low" },
  { experienceId: "exp-ok", fit: 0.6, novelty: 0.5, risk: "medium" },
];

describe("ExperienceSelectionModel — contract", () => {
  it("ranks the best candidate first: high fit, low risk, high novelty", async () => {
    const model = new HeuristicSelectionModel();
    const results = await model.select(context, candidates);
    expect(results[0]?.experienceId).toBe("exp-best");
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
    expect(results[0]?.modelVersion).toBe(model.modelVersion);
    expect(typeof results[0]?.rationale).toBe("string");
  });

  it("is deterministic: same input → same ranking and same input hash", async () => {
    const model = new HeuristicSelectionModel();
    const first = await model.select(context, candidates);
    const second = await model.select(context, candidates);
    expect(second.map((r) => r.experienceId)).toEqual(
      first.map((r) => r.experienceId),
    );
    expect(second[0]?.inputHash).toBe(first[0]?.inputHash);
  });

  it("is swappable: any implementation satisfies the contract", async () => {
    const stub: ExperienceSelectionModel = {
      modelVersion: "stub-1",
      select: async (_ctx, cands) =>
        [...cands].reverse().map((c) => ({
          experienceId: c.experienceId,
          score: 1,
          rationale: "stub",
          modelVersion: "stub-1",
          inputHash: "stub-hash",
        })),
    };
    const results = await stub.select(context, candidates);
    expect(results[0]?.experienceId).toBe("exp-ok");
    expect(results[0]?.modelVersion).toBe("stub-1");
  });
});

describe("Selection evaluation — reproducible", () => {
  const cases: EvaluationCase[] = [
    { context, candidates, expectedExperienceId: "exp-best" },
    {
      context: { ...context, contextSnapshotId: "snap-2" },
      candidates,
      expectedExperienceId: "exp-best",
    },
    {
      context: { ...context, contextSnapshotId: "snap-3" },
      candidates: [...candidates].reverse(),
      expectedExperienceId: "exp-best",
    },
  ];

  it("scores hit@1 and MRR for a model on a fixed dataset", async () => {
    const report = await evaluateSelection(
      new HeuristicSelectionModel(),
      cases,
    );
    expect(report.modelVersion).toBe(
      new HeuristicSelectionModel().modelVersion,
    );
    expect(report.cases).toBe(3);
    expect(report.hitAt1).toBe(1);
    expect(report.mrr).toBe(1);
    expect(report.results).toHaveLength(3);
  });

  it("distinguishes a bad model from a good one on the same dataset", async () => {
    const bad: ExperienceSelectionModel = {
      modelVersion: "bad-1",
      select: async (_ctx, cands) =>
        [...cands].reverse().map((c) => ({
          experienceId: c.experienceId,
          score: 1,
          rationale: "reversed",
          modelVersion: "bad-1",
          inputHash: "x",
        })),
    };
    const report = await evaluateSelection(bad, cases);
    expect(report.hitAt1).toBeLessThan(1);
    expect(report.modelVersion).toBe("bad-1");
  });
});
