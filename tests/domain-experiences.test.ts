import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/shared/errors";
import {
  createReport,
  finishAttempt,
  proposeRecommendation,
  resolveRecommendation,
  startAttempt,
} from "../src/domains/experiences/logic";

const userId = "22222222-2222-4222-8222-222222222222";
const experienceId = "33333333-3333-4333-8333-333333333333";

function proposed() {
  return proposeRecommendation({
    userId,
    experienceId,
    agentRunId: "44444444-4444-4444-8444-444444444444",
    contextSnapshotId: "55555555-5555-4555-8555-555555555555",
    reason: "matches curiosity about fermentation",
    fit: 0.8,
    risk: "low",
    confidence: 0.7,
  });
}

describe("ExperienceRecommendation lifecycle (PLAN §17)", () => {
  it("starts proposed and validates fit/confidence ranges", () => {
    const r = proposed();
    expect(r.status).toBe("proposed");
    expect(() =>
      proposeRecommendation({
        userId,
        experienceId,
        agentRunId: "44444444-4444-4444-8444-444444444444",
        contextSnapshotId: "55555555-5555-4555-8555-555555555555",
        reason: "x",
        fit: 1.2,
        risk: "low",
        confidence: 0.5,
      }),
    ).toThrowError(ValidationError);
  });

  it("moves proposed → accepted | rejected | expired, once", () => {
    expect(resolveRecommendation(proposed(), "accepted").status).toBe("accepted");
    expect(resolveRecommendation(proposed(), "rejected").status).toBe("rejected");
    const accepted = resolveRecommendation(proposed(), "accepted");
    expect(() => resolveRecommendation(accepted, "rejected")).toThrowError(
      ValidationError,
    );
  });
});

describe("ExperienceAttempt + Report (PLAN §§18–19)", () => {
  it("runs started → completed | abandoned", () => {
    const a = startAttempt({ userId, experienceId, recommendationId: null });
    expect(a.status).toBe("started");
    expect(finishAttempt(a, "completed").status).toBe("completed");
    expect(finishAttempt(a, "abandoned").status).toBe("abandoned");
    const done = finishAttempt(a, "completed");
    expect(() => finishAttempt(done, "abandoned")).toThrowError(ValidationError);
  });

  it("a report requires a completed attempt", () => {
    const completed = finishAttempt(
      startAttempt({ userId, experienceId, recommendationId: null }),
      "completed",
    );
    const report = createReport({
      attempt: completed,
      content: "It was harder than expected, but I kept going.",
    });
    expect(report.attemptId).toBe(completed.id);

    const abandoned = finishAttempt(
      startAttempt({ userId, experienceId, recommendationId: null }),
      "abandoned",
    );
    expect(() =>
      createReport({ attempt: abandoned, content: "x" }),
    ).toThrowError(ValidationError);
  });
});
