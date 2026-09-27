import { describe, expect, it, vi } from "vitest";
import { AGENT_CONTRACTS } from "../src/application/mind/contracts";
import { Mind } from "../src/application/mind/mind";
import type {
  AgentExecutor,
  AgentRunRecorder,
  IntentClassifier,
  SafetyChecker,
} from "../src/application/mind/ports";
import { SafetyGate } from "../src/application/mind/safety";
import { ToolRegistry } from "../src/application/mind/tools";
import { ArchitectureError } from "../src/shared/errors";

const classifier: IntentClassifier = {
  async classify(event) {
    return event.text.includes("experience")
      ? { agent: "experience", confidence: 0.9 }
      : { agent: "companion", confidence: 0.9 };
  },
};

const allowAll: SafetyChecker = {
  async check() {
    return { allowed: true };
  },
};

const recorder: AgentRunRecorder = {
  start: vi.fn(async () => "run-1"),
  end: vi.fn(async () => {}),
};

function tools() {
  return new ToolRegistry({
    getRelevantHumanContext: {
      description: "read scoped human context",
      handler: async () => ({ claims: [] }),
    },
    updateDevelopmentPlan: {
      description: "write development plan",
      handler: async () => ({ ok: true }),
    },
  });
}

describe("Mind (PLAN §§27–29)", () => {
  it("ACCEPTANCE: no agent can bypass architectural boundaries", async () => {
    const registry = tools();
    // companion CAN use its allowed tool…
    await expect(
      registry.execute("companion", "getRelevantHumanContext", {}),
    ).resolves.toEqual({ claims: [] });
    // …but CANNOT touch another agent's tool
    await expect(
      registry.execute("companion", "updateDevelopmentPlan", {}),
    ).rejects.toThrowError(ArchitectureError);
    // unknown tools are rejected too
    await expect(
      registry.execute("companion", "dropDatabase", {}),
    ).rejects.toThrowError(ArchitectureError);
  });

  it("contracts forbid what the plan forbids (e.g. companion mutating claims)", () => {
    const companion = AGENT_CONTRACTS.companion;
    expect(companion.allowedTools).toContain("getRelevantHumanContext");
    expect(companion.allowedTools).not.toContain("updateDevelopmentPlan");
    expect(companion.forbidden).toContain("directly mutate claims");
  });

  it("routes an event to the classified agent and records the run", async () => {
    const execute: AgentExecutor = vi.fn(async () => ({
      text: "try this experience",
      uiActions: [],
    }));
    const mind = new Mind({
      classifier,
      safety: new SafetyGate(allowAll),
      tools: tools(),
      execute,
      recorder,
    });
    const result = await mind.dispatch({
      userId: "u1",
      text: "recommend me an experience",
    });
    expect(result.text).toBe("try this experience");
    expect(execute).toHaveBeenCalledWith(
      "experience",
      expect.objectContaining({ userId: "u1" }),
    );
    expect(recorder.start).toHaveBeenCalledWith(
      expect.objectContaining({ agentType: "experience" }),
    );
    expect(recorder.end).toHaveBeenCalledWith(
      "run-1",
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("safety interception stops the agent before execution", async () => {
    const execute: AgentExecutor = vi.fn();
    const mind = new Mind({
      classifier,
      safety: new SafetyGate({
        async check() {
          return {
            allowed: false,
            action: "redirect",
            reason: "self-harm risk",
          };
        },
      }),
      tools: tools(),
      execute,
      recorder,
    });
    const result = await mind.dispatch({ userId: "u1", text: "hello" });
    expect(execute).not.toHaveBeenCalled();
    expect(result.blocked).toBe(true);
    expect(result.safetyAction).toBe("redirect");
  });

  it("agent failures are recorded, not swallowed", async () => {
    const execute: AgentExecutor = async () => {
      throw new Error("llm exploded");
    };
    const mind = new Mind({
      classifier,
      safety: new SafetyGate(allowAll),
      tools: tools(),
      execute,
      recorder,
    });
    await expect(
      mind.dispatch({ userId: "u1", text: "hello" }),
    ).rejects.toThrowError("llm exploded");
    expect(recorder.end).toHaveBeenCalledWith(
      "run-1",
      expect.objectContaining({ status: "failed" }),
    );
  });
});
