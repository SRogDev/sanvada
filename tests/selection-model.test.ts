/**
 * Phase 13 — Production model (PLAN §41).
 *
 * The production selection model MUST stay behind ExperienceSelectionModel.
 * GatewaySelectionModel validates every output with ExperienceSelectionSchema.
 */
import { describe, expect, it, vi } from "vitest";
import { HeuristicSelectionModel } from "../src/application/experience-selection/model.js";
import type {
  SelectionCandidate,
  SelectionContext,
} from "../src/application/experience-selection/ports.js";
import {
  GatewaySelectionModel,
  resolveSelectionModel,
} from "../src/infrastructure/llm/selection-model.js";

const context: SelectionContext = {
  userId: "u1",
  objectiveId: "obj-1",
  contextSnapshotId: "snap-1",
  agentRunId: "run-1",
};

const candidates: SelectionCandidate[] = [
  {
    experienceId: "123e4567-e89b-12d3-a456-426614174000",
    fit: 0.8,
    novelty: 0.5,
    risk: "low",
  },
  {
    experienceId: "123e4567-e89b-12d3-a456-426614174001",
    fit: 0.6,
    novelty: 0.5,
    risk: "low",
  },
];

const validOutput = [
  {
    experienceId: "123e4567-e89b-12d3-a456-426614174000",
    reason: "best fit",
    targetCapability: "reflection",
    fit: 0.9,
    risk: "low",
    confidence: 0.8,
  },
];

describe("resolveSelectionModel", () => {
  it("defaults to the heuristic model", () => {
    vi.stubEnv("SELECTION_MODEL", "");
    const model = resolveSelectionModel();
    expect(model).toBeInstanceOf(HeuristicSelectionModel);
    vi.unstubAllEnvs();
  });

  it("resolves the gateway model when SELECTION_MODEL=gateway", () => {
    vi.stubEnv("SELECTION_MODEL", "gateway");
    const model = resolveSelectionModel({
      generateSelections: async () => validOutput,
    });
    expect(model).toBeInstanceOf(GatewaySelectionModel);
    expect(model.modelVersion).toBe("gateway-1.0.0");
    vi.unstubAllEnvs();
  });
});

describe("GatewaySelectionModel", () => {
  it("validates output with ExperienceSelectionSchema and ranks by fit", async () => {
    const model = new GatewaySelectionModel("test-model", {
      generateSelections: async () => validOutput,
    });
    const results = await model.select(context, candidates);
    expect(results[0]?.experienceId).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(results[0]?.score).toBe(0.9);
    expect(results[0]?.rationale).toBe("best fit");
    expect(typeof results[0]?.inputHash).toBe("string");
  });

  it("rejects invalid model output — never trusts raw LLM JSON", async () => {
    const model = new GatewaySelectionModel("test-model", {
      generateSelections: async () => [{ experienceId: "not-a-uuid", fit: 99 }],
    });
    await expect(model.select(context, candidates)).rejects.toThrow();
  });

  it("rejects selections for unknown experience ids", async () => {
    const model = new GatewaySelectionModel("test-model", {
      generateSelections: async () => [
        {
          ...validOutput[0],
          experienceId: "123e4567-e89b-12d3-a456-426614174999",
        },
      ],
    });
    await expect(model.select(context, candidates)).rejects.toThrow(/unknown/);
  });

  it("requires AI_GATEWAY_API_KEY when no generator is injected", () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    expect(() => new GatewaySelectionModel()).toThrow(/AI_GATEWAY_API_KEY/);
    vi.unstubAllEnvs();
  });
});
