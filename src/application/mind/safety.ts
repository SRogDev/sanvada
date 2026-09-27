import type {
  AgentType,
  MindEvent,
  SafetyChecker,
  SafetyCheckResult,
} from "./ports";

/**
 * Safety interception (PLAN §§27, 44). Runs BEFORE the target agent.
 * Returns null when the event may proceed.
 */
export class SafetyGate {
  constructor(private readonly checker: SafetyChecker) {}

  async intercept(
    event: MindEvent,
    agent: AgentType,
  ): Promise<SafetyCheckResult | null> {
    const result = await this.checker.check(event, agent);
    return result.allowed ? null : result;
  }
}
