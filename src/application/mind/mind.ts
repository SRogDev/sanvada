import type {
  AgentExecutor,
  AgentInput,
  AgentResult,
  AgentRunRecorder,
  IntentClassifier,
  MindEvent,
} from "./ports";
import type { SafetyGate } from "./safety";
import type { ToolRegistry } from "./tools";

export interface MindDependencies {
  classifier: IntentClassifier;
  safety: SafetyGate;
  tools: ToolRegistry;
  execute: AgentExecutor;
  recorder: AgentRunRecorder;
}

/**
 * Mind — central orchestrator (PLAN §27).
 * event → routing → safety → agent → result, with observability
 * around every run (agent_runs, PLAN §20).
 */
export class Mind {
  constructor(private readonly deps: MindDependencies) {}

  async dispatch(event: MindEvent): Promise<AgentResult> {
    const startedAt = Date.now();
    const { agent } = await this.deps.classifier.classify(event);
    const runId = await this.deps.recorder.start({
      userId: event.userId,
      agentType: agent,
      conversationId: event.conversationId,
    });

    const blocked = await this.deps.safety.intercept(event, agent);
    if (blocked) {
      await this.deps.recorder.end(runId, {
        status: "completed",
        latencyMs: Date.now() - startedAt,
      });
      return {
        text: "",
        uiActions: [],
        blocked: true,
        safetyAction: blocked.action ?? "redirect",
      };
    }

    const input: AgentInput = {
      userId: event.userId,
      text: event.text,
      agent,
      tools: this.deps.tools,
    };
    try {
      const result = await this.deps.execute(agent, input);
      await this.deps.recorder.end(runId, {
        status: "completed",
        latencyMs: Date.now() - startedAt,
      });
      return result;
    } catch (error) {
      await this.deps.recorder.end(runId, {
        status: "failed",
        latencyMs: Date.now() - startedAt,
      });
      throw error;
    }
  }
}
