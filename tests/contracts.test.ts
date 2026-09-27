import { describe, expect, it } from "vitest";
import { ExperienceSelectionSchema } from "../src/shared/schemas/experience-selection";

const valid = {
  experienceId: "123e4567-e89b-12d3-a456-426614174000",
  reason:
    "Matches the user's goal of building focus through short outdoor sessions.",
  targetCapability: "sustained-attention",
  fit: 0.87,
  risk: "low",
  confidence: 0.72,
};

describe("ExperienceSelectionSchema (PLAN §5 contract example)", () => {
  it("accepts a well-formed experience selection", () => {
    expect(() => ExperienceSelectionSchema.parse(valid)).not.toThrow();
  });

  it("rejects fit outside [0, 1] — never trust raw LLM JSON", () => {
    expect(
      ExperienceSelectionSchema.safeParse({ ...valid, fit: 1.5 }).success,
    ).toBe(false);
    expect(
      ExperienceSelectionSchema.safeParse({ ...valid, fit: -0.1 }).success,
    ).toBe(false);
  });

  it("rejects an unknown risk level", () => {
    expect(
      ExperienceSelectionSchema.safeParse({ ...valid, risk: "extreme" })
        .success,
    ).toBe(false);
  });

  it("rejects a non-UUID experience id", () => {
    expect(
      ExperienceSelectionSchema.safeParse({ ...valid, experienceId: "abc" })
        .success,
    ).toBe(false);
  });

  it("rejects confidence outside [0, 1]", () => {
    expect(
      ExperienceSelectionSchema.safeParse({ ...valid, confidence: 2 }).success,
    ).toBe(false);
  });
});
