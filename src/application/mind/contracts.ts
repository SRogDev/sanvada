import type { AgentType } from "./ports";

/**
 * Agent contracts (PLAN §28). Each agent gets allowed tools, allowed
 * context, responsibilities — and explicit forbidden responsibilities.
 * The ToolRegistry enforces these at runtime.
 */
export interface AgentContract {
  responsibilities: string[];
  forbidden: string[];
  allowedTools: string[];
  allowedContext: string[];
}

export const AGENT_CONTRACTS: Record<AgentType, AgentContract> = {
  mind: {
    responsibilities: ["route events", "enforce safety", "coordinate agents"],
    forbidden: ["autonomous reasoning loops", "direct user conversation"],
    allowedTools: [],
    allowedContext: ["routing context"],
  },
  companion: {
    responsibilities: [
      "conversation",
      "reflection",
      "explain Human Context",
      "request relevant context",
    ],
    forbidden: [
      "directly mutate claims",
      "bypass Safety",
      "modify database state arbitrarily",
    ],
    allowedTools: ["getRelevantHumanContext", "createConversationEvidence"],
    allowedContext: ["scoped Human Context", "conversation history"],
  },
  development: {
    responsibilities: [
      "analyze objectives",
      "update development plan",
      "identify areas for exploration",
      "request experience recommendations",
    ],
    forbidden: ["prescribe rigid schedules", "act as a habit tracker"],
    allowedTools: [
      "getDevelopmentContext",
      "updateDevelopmentPlan",
      "requestExperienceSelection",
    ],
    allowedContext: ["objectives", "development plans", "scoped Human Context"],
  },
  experience: {
    responsibilities: [
      "evaluate experiences",
      "select experiences",
      "create recommendations",
      "process experience reports",
    ],
    forbidden: [
      "assign difficulty scores",
      "recommend high-risk experiences unchecked",
    ],
    allowedTools: [
      "getCandidateExperiences",
      "selectExperience",
      "createRecommendation",
    ],
    allowedContext: ["experience catalog", "scoped Human Context"],
  },
  human_context: {
    responsibilities: [
      "interpret evidence",
      "version claims",
      "detect contradictions",
      "build snapshots",
    ],
    forbidden: ["delete claim history", "expose full context to agents"],
    allowedTools: ["getRelevantClaims", "applyClaimUpdate"],
    allowedContext: ["evidence", "claims"],
  },
  safety: {
    responsibilities: ["intercept unsafe actions", "record safety events"],
    forbidden: [
      "censor benign content",
      "store sensitive content unnecessarily",
    ],
    allowedTools: ["recordSafetyEvent"],
    allowedContext: ["safety policies"],
  },
};
