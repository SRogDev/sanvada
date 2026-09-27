import type { ToolRegistry } from "./tools";

/**
 * Ports: Mind orchestrator (PLAN §§27–29).
 * Mind is event → routing → agent → result. It is NOT a giant
 * autonomous reasoning loop.
 */

export type AgentType =
  | "mind"
  | "companion"
  | "development"
  | "experience"
  | "human_context"
  | "safety";

export interface MindEvent {
  userId: string;
  text: string;
  conversationId?: string;
}

export interface ClassifiedIntent {
  agent: Exclude<AgentType, "mind" | "safety">;
  confidence: number;
}

export interface IntentClassifier {
  classify(event: MindEvent): Promise<ClassifiedIntent>;
}

export type SafetyAction =
  | "continue"
  | "soft_caution"
  | "redirect"
  | "professional_support"
  | "block_experience";

export interface SafetyCheckResult {
  allowed: boolean;
  action?: SafetyAction;
  reason?: string;
}

export interface SafetyChecker {
  check(event: MindEvent, agent: AgentType): Promise<SafetyCheckResult>;
}

export interface AgentResult {
  text: string;
  uiActions: unknown[];
  blocked?: boolean;
  safetyAction?: SafetyAction;
}

export interface AgentInput {
  userId: string;
  text: string;
  agent: AgentType;
  tools: ToolRegistry;
}

export type AgentExecutor = (
  agent: AgentType,
  input: AgentInput,
) => Promise<AgentResult>;

export interface AgentRunRecorder {
  start(run: {
    userId: string;
    agentType: AgentType;
    conversationId?: string;
  }): Promise<string>;
  end(
    runId: string,
    outcome: { status: "completed" | "failed"; latencyMs?: number },
  ): Promise<void>;
}
