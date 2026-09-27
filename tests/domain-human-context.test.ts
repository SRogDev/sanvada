import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/shared/errors";
import {
  applyClaimVersion,
  buildSnapshot,
  createEvidence,
  openClaim,
  transitionEvidenceRelevance,
} from "../src/domains/human-context/logic";

const userId = "11111111-1111-4111-8111-111111111111";

describe("Evidence (PLAN §9)", () => {
  it("is created pending with trimmed non-empty content", () => {
    const e = createEvidence({
      userId,
      sourceType: "conversation",
      content: "  user said they love night walks  ",
    });
    expect(e.relevanceStatus).toBe("pending");
    expect(e.content).toBe("user said they love night walks");
    expect(e.id).toBeDefined();
  });

  it("rejects empty content", () => {
    expect(() =>
      createEvidence({ userId, sourceType: "conversation", content: "   " }),
    ).toThrowError(ValidationError);
  });

  it("allows pending → relevant → processed", () => {
    const e = createEvidence({
      userId,
      sourceType: "conversation",
      content: "x",
    });
    const relevant = transitionEvidenceRelevance(e, "relevant");
    expect(relevant.relevanceStatus).toBe("relevant");
    const processed = transitionEvidenceRelevance(relevant, "processed");
    expect(processed.relevanceStatus).toBe("processed");
    // pure: input untouched
    expect(e.relevanceStatus).toBe("pending");
  });

  it("rejects illegal transitions (e.g. processed → relevant)", () => {
    const e = transitionEvidenceRelevance(
      createEvidence({ userId, sourceType: "conversation", content: "x" }),
      "relevant",
    );
    const processed = transitionEvidenceRelevance(e, "processed");
    expect(() => transitionEvidenceRelevance(processed, "relevant")).toThrowError(
      ValidationError,
    );
    expect(() => transitionEvidenceRelevance(processed, "pending")).toThrowError(
      ValidationError,
    );
  });
});

describe("Claim + ClaimVersion (PLAN §§10–11)", () => {
  it("opens a claim with its first version (supersedes nothing)", () => {
    const { claim, version } = openClaim({
      userId,
      category: "preference",
      claimText: "Prefers night walks for thinking",
      status: "observed",
      confidence: 0.4,
    });
    expect(claim.currentStatus).toBe("observed");
    expect(claim.currentConfidence).toBe(0.4);
    expect(version.claimId).toBe(claim.id);
    expect(version.supersedesVersionId).toBeNull();
  });

  it("new versions supersede the latest; history is never mutated", () => {
    const { claim, version: v1 } = openClaim({
      userId,
      category: "preference",
      claimText: "Prefers night walks",
      status: "observed",
      confidence: 0.4,
    });
    const { claim: claim2, version: v2 } = applyClaimVersion(claim, v1, {
      claimText: "Prefers long night walks alone",
      status: "inferred",
      confidence: 0.65,
      reason: "mentioned it three times this week",
    });
    expect(v2.supersedesVersionId).toBe(v1.id);
    expect(claim2.currentStatus).toBe("inferred");
    expect(claim2.currentConfidence).toBe(0.65);
    // v1 untouched
    expect(v1.claimText).toBe("Prefers night walks");
    expect(v1.status).toBe("observed");
  });

  it("rejects confidence outside [0,1]", () => {
    expect(() =>
      openClaim({
        userId,
        category: "value",
        claimText: "x",
        status: "observed",
        confidence: 1.5,
      }),
    ).toThrowError(ValidationError);
  });
});

describe("HumanContextSnapshot (PLAN §13)", () => {
  it("references claim versions without duplicating them", () => {
    const { version } = openClaim({
      userId,
      category: "interest",
      claimText: "Curious about fermentation",
      status: "observed",
      confidence: 0.5,
    });
    const snap = buildSnapshot({
      userId,
      version: 1,
      claimVersionIds: [version.id],
      trigger: "major_update",
    });
    expect(snap.version).toBe(1);
    expect(snap.snapshotData.claimVersions).toEqual([version.id]);
  });
});
