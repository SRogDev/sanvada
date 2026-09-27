/**
 * Phase 7 — Development (PLAN §31).
 *
 * Recommendation generation, attempt lifecycle, review requests,
 * report synthesis, evidence generation.
 *
 * Acceptance: the user can complete a recommendation and reflect on it.
 */
import { describe, expect, it } from "vitest";
import { DevelopmentAgent } from "../src/application/development/development.js";
import type { DevelopmentDeps } from "../src/application/development/ports.js";
import type {
  ExperienceAttempt,
  ExperienceRecommendation,
  ExperienceReport,
} from "../src/domains/experiences/types.js";

const store = {
  recommendations: new Map<string, ExperienceRecommendation>(),
  attempts: new Map<string, ExperienceAttempt>(),
  reports: [] as ExperienceReport[],
  reviewRequests: [] as string[],
  evidence: [] as { userId: string; content: string }[],
};

function makeDeps(): DevelopmentDeps {
  return {
    listActiveObjectives: async (userId) => [
      {
        id: "obj-1",
        userId,
        title: "Become more reflective",
        description: null,
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
    ],
    candidateExperiences: async () => [
      {
        experienceId: "exp-1",
        fit: 0.8,
        risk: "low" as const,
        reason: "Matches reflection goal",
      },
    ],
    persistRecommendation: async (r) => {
      store.recommendations.set(r.id, r);
    },
    getRecommendation: async (id) => store.recommendations.get(id) ?? null,
    updateRecommendation: async (r) => {
      store.recommendations.set(r.id, r);
    },
    persistAttempt: async (a) => {
      store.attempts.set(a.id, a);
    },
    getAttempt: async (id) => store.attempts.get(id) ?? null,
    updateAttempt: async (a) => {
      store.attempts.set(a.id, a);
    },
    persistReport: async (r) => {
      store.reports.push(r);
    },
    synthesizeReportText: async (attempt) =>
      `Reflection on attempt ${attempt.id}: completed with intention.`,
    recordReviewRequest: async (attemptId) => {
      store.reviewRequests.push(attemptId);
    },
    submitEvidence: async (userId, content) => {
      store.evidence.push({ userId, content });
    },
  };
}

describe("Development — recommendation to reflection", () => {
  it("generates recommendations for an active objective", async () => {
    const agent = new DevelopmentAgent(makeDeps());
    const recs = await agent.recommendForObjective({
      userId: "u1",
      objectiveId: "obj-1",
      agentRunId: "run-1",
      contextSnapshotId: "snap-1",
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]?.status).toBe("proposed");
    expect(recs[0]?.reason).toBe("Matches reflection goal");
  });

  it("accepting a recommendation starts an attempt (acceptance flow)", async () => {
    const agent = new DevelopmentAgent(makeDeps());
    const [rec] = await agent.recommendForObjective({
      userId: "u1",
      objectiveId: "obj-1",
      agentRunId: "run-1",
      contextSnapshotId: "snap-1",
    });
    const attempt = await agent.acceptRecommendation({
      recommendationId: rec?.id ?? "",
    });
    expect(attempt.status).toBe("started");
    expect(attempt.recommendationId).toBe(rec?.id);
    expect(store.recommendations.get(rec?.id ?? "")?.status).toBe("accepted");
  });

  it("completing an attempt synthesizes a report and submits evidence", async () => {
    const agent = new DevelopmentAgent(makeDeps());
    const [rec] = await agent.recommendForObjective({
      userId: "u1",
      objectiveId: "obj-1",
      agentRunId: "run-1",
      contextSnapshotId: "snap-1",
    });
    const attempt = await agent.acceptRecommendation({
      recommendationId: rec?.id ?? "",
    });
    const report = await agent.completeAttempt({
      attemptId: attempt.id,
      outcome: "completed",
      reflection: { learned: "I notice more when I write it down" },
    });
    expect(report.attemptId).toBe(attempt.id);
    expect(report.content).toContain(attempt.id);
    expect(store.attempts.get(attempt.id)?.status).toBe("completed");
    expect(store.evidence.length).toBeGreaterThan(0);
    expect(store.evidence[store.evidence.length - 1]?.userId).toBe("u1");
  });

  it("requesting a review records a review request", async () => {
    const agent = new DevelopmentAgent(makeDeps());
    const [rec] = await agent.recommendForObjective({
      userId: "u1",
      objectiveId: "obj-1",
      agentRunId: "run-1",
      contextSnapshotId: "snap-1",
    });
    const attempt = await agent.acceptRecommendation({
      recommendationId: rec?.id ?? "",
    });
    await agent.requestReview({ attemptId: attempt.id });
    expect(store.reviewRequests).toContain(attempt.id);
  });

  it("rejects completing an already-finished attempt", async () => {
    const agent = new DevelopmentAgent(makeDeps());
    const [rec] = await agent.recommendForObjective({
      userId: "u1",
      objectiveId: "obj-1",
      agentRunId: "run-1",
      contextSnapshotId: "snap-1",
    });
    const attempt = await agent.acceptRecommendation({
      recommendationId: rec?.id ?? "",
    });
    await agent.completeAttempt({
      attemptId: attempt.id,
      outcome: "completed",
    });
    await expect(
      agent.completeAttempt({ attemptId: attempt.id, outcome: "completed" }),
    ).rejects.toThrow();
  });
});
