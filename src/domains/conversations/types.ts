import type { ISODateString, UUID } from "@/shared/types";

/**
 * Domain: conversations (PLAN §8).
 * Structured Human Context is NEVER stored inside message metadata.
 */
export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Conversation {
  id: UUID;
  userId: UUID;
  title: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Message {
  id: UUID;
  conversationId: UUID;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
}
