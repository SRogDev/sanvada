import type { RelevantClaim } from "./ports.js";
import type {
  CompanionDeps,
  CompanionInput,
  CompanionResult,
  SentientUIEvent,
  TextStreamPort,
} from "./ports.js";

const BASE_SYSTEM =
  "You are Sanvada, a companion that helps the user understand themselves. " +
  "Use the human-context claims below when relevant; never invent facts about the user.";

/** Companion agent (PLAN §30): streaming conversation with context retrieval. */
export class CompanionAgent {
  constructor(
    private readonly streamPort: TextStreamPort,
    private readonly deps: CompanionDeps,
  ) {}

  async execute(input: CompanionInput): Promise<CompanionResult> {
    const query = lastUserText(input.messages);
    const claims = await this.deps.retrieveContext(input.userId, query);
    const systemPrompt = buildSystemPrompt(claims);
    const chunks: string[] = [];
    for await (const chunk of this.streamPort.stream({
      system: systemPrompt,
      messages: input.messages,
    })) {
      chunks.push(chunk);
    }
    const text = chunks.join("");
    const uiEvents = buildUiEvents(claims);
    const transcript = [
      ...input.messages,
      { role: "assistant" as const, content: text },
    ];
    await this.deps.storeConversation({
      userId: input.userId,
      conversationId: input.conversationId,
      messages: transcript,
      occurredAt: new Date().toISOString(),
    });
    // Evidence generation must not block the streamed response.
    const evidenceRecorded = this.deps.recordEvidence({
      userId: input.userId,
      conversationId: input.conversationId,
      summary: query.slice(0, 280),
      claimsReferenced: claims.map((c) => c.claimId),
      transcript,
    });
    return { text, systemPrompt, uiEvents, evidenceRecorded };
  }
}

function lastUserText(messages: CompanionInput["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return messages[i]?.content.trim() ?? "";
  }
  return "";
}

function buildSystemPrompt(claims: RelevantClaim[]): string {
  if (claims.length === 0) return BASE_SYSTEM;
  const lines = claims.map(
    (c) => `- ${c.summary} (confidence ${c.confidence.toFixed(2)})`,
  );
  return `${BASE_SYSTEM}\n\nRelevant human-context claims:\n${lines.join("\n")}`;
}

function buildUiEvents(claims: RelevantClaim[]): SentientUIEvent[] {
  return claims
    .filter((c) => c.confidence >= 0.7)
    .map((c) => ({
      type: "context_insight" as const,
      payload: {
        claimId: c.claimId,
        summary: c.summary,
        confidence: c.confidence,
      },
    }));
}
