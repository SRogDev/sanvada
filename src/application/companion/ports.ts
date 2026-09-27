/** A human-context claim surfaced to the companion for conversation grounding. */
export interface RelevantClaim {
  claimId: string;
  currentVersion: string;
  summary: string;
  confidence: number;
  relevance: number;
}

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamParams {
  system: string;
  messages: StreamMessage[];
}

/** LLM text streaming seam (PLAN §30). Implemented by AI SDK in infrastructure. */
export interface TextStreamPort {
  stream(params: StreamParams): AsyncIterable<string>;
}

export type SentientUIEventType =
  | "context_insight"
  | "experience_recommendation"
  | "self_map_update"
  | "reflection_prompt";

export interface SentientUIEvent {
  type: SentientUIEventType;
  payload: unknown;
}

export interface ConversationEvidence {
  userId: string;
  conversationId: string;
  summary: string;
  claimsReferenced: string[];
  transcript: StreamMessage[];
}

export interface StoredConversation {
  userId: string;
  conversationId: string;
  messages: StreamMessage[];
  occurredAt: string;
}

export interface CompanionDeps {
  retrieveContext: (userId: string, query: string) => Promise<RelevantClaim[]>;
  storeConversation: (turn: StoredConversation) => Promise<void>;
  recordEvidence: (evidence: ConversationEvidence) => Promise<void>;
}

export interface CompanionInput {
  userId: string;
  conversationId: string;
  messages: StreamMessage[];
}

export interface CompanionResult {
  text: string;
  systemPrompt: string;
  uiEvents: SentientUIEvent[];
  /** Resolves when the (non-blocking) evidence recording finishes. */
  evidenceRecorded: Promise<void>;
}
