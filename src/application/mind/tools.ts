import { ArchitectureError } from "@/shared/errors";
import { AGENT_CONTRACTS } from "./contracts";
import type { AgentType } from "./ports";

/**
 * Tool permissions (PLAN §29). Agents never receive arbitrary database
 * access — every tool call is checked against the agent's contract.
 * A violation throws ArchitectureError: this is the runtime acceptance
 * that no agent can bypass architectural boundaries.
 */
export interface ToolDefinition {
  description: string;
  // biome-ignore lint/suspicious/noExplicitAny: tool args are validated by Zod at each tool's boundary.
  handler: (args: any) => Promise<unknown>;
}

export class ToolRegistry {
  constructor(private readonly tools: Record<string, ToolDefinition>) {}

  async execute(
    agent: AgentType,
    toolName: string,
    // biome-ignore lint/suspicious/noExplicitAny: see above.
    args: any,
  ): Promise<unknown> {
    const contract = AGENT_CONTRACTS[agent];
    const tool = this.tools[toolName];
    if (!tool || !contract.allowedTools.includes(toolName)) {
      throw new ArchitectureError(
        `Agent "${agent}" is not allowed to use tool "${toolName}".`,
      );
    }
    return tool.handler(args);
  }

  allowedFor(agent: AgentType): string[] {
    return [...AGENT_CONTRACTS[agent].allowedTools];
  }
}
