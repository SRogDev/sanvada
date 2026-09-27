import type { ISODateString, UUID } from "@/shared/types";

/**
 * Domain: safety (PLAN §§21, 44).
 * No diagnosis, no hidden mental-health score, no unnecessary sensitive
 * content stored.
 */
export type SafetyAction =
  | "continue"
  | "soft_caution"
  | "redirect"
  | "professional_support"
  | "block_experience";

export interface SafetyEvent {
  id: UUID;
  userId: UUID;
  agentRunId: UUID | null;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  action: SafetyAction;
  createdAt: ISODateString;
}
