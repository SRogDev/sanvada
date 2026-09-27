/**
 * Phase 6 — Companion (PLAN §30).
 *
 * Streaming, context retrieval, conversation, evidence generation
 * (non-blocking), contextual UI events.
 *
 * Acceptance: the user can have a complete conversation and the
 * conversation generates human-context evidence.
 */
import { describe, expect, it, vi } from "vitest";
import { CompanionAgent } from "../src/application/companion/companion.js";
import type {
  RelevantClaim,
  StreamMessage,
  TextStreamPort,
} from "../src/application/companion/ports.js";

function fakeStream(chunks: string[]): TextStreamPort {
  return {
    async *stream(_params: { system: string; messages: StreamMessage[] }) {
      for (const c of chunks) yield c;
    },
  };
}

const claim: RelevantClaim = {
  claimId: "claim-1",
  currentVersion: "v2",
  summary: "Loves night walks",
  confidence: 0.9,
  relevance: 0.95,
};

describe("Companion — complete conversation", () => {
  it("assembles streamed chunks into the full response text", async () => {
    const agent = new CompanionAgent(fakeStream(["Hola", ", Roger"]), {
      retrieveContext: async () => [],
      storeConversation: async () => {},
      recordEvidence: async () => {},
    });
    const result = await agent.execute({
      userId: "u1",
      conversationId: "c1",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.text).toBe("Hola, Roger");
  });

  it("retrieves relevant human context and injects it into the system prompt", async () => {
    const retrieveContext = vi.fn(async () => [claim]);
    const agent = new CompanionAgent(fakeStream(["ok"]), {
      retrieveContext,
      storeConversation: async () => {},
      recordEvidence: async () => {},
    });
    const result = await agent.execute({
      userId: "u1",
      conversationId: "c1",
      messages: [{ role: "user", content: "What do I enjoy?" }],
    });
    expect(retrieveContext).toHaveBeenCalledWith("u1", "What do I enjoy?");
    expect(result.systemPrompt).toContain("Loves night walks");
  });

  it("emits a contextual UI event when a high-confidence claim is relevant", async () => {
    const agent = new CompanionAgent(fakeStream(["ok"]), {
      retrieveContext: async () => [claim],
      storeConversation: async () => {},
      recordEvidence: async () => {},
    });
    const result = await agent.execute({
      userId: "u1",
      conversationId: "c1",
      messages: [{ role: "user", content: "What do I enjoy?" }],
    });
    expect(result.uiEvents).toHaveLength(1);
    expect(result.uiEvents[0]?.type).toBe("context_insight");
    expect(result.uiEvents[0]?.payload).toMatchObject({ claimId: "claim-1" });
  });

  it("records conversation evidence without blocking the streamed response", async () => {
    let evidenceRecorded = false;
    const recordEvidence = vi.fn(
      async (_evidence: {
        userId: string;
        conversationId: string;
        claimsReferenced: string[];
      }) => {
        evidenceRecorded = true;
      },
    );
    const agent = new CompanionAgent(fakeStream(["a", "b"]), {
      retrieveContext: async () => [claim],
      storeConversation: async () => {},
      recordEvidence,
    });
    const result = await agent.execute({
      userId: "u1",
      conversationId: "c1",
      messages: [{ role: "user", content: "Hello" }],
    });
    // Response text is already complete before evidence resolves.
    expect(result.text).toBe("ab");
    expect(recordEvidence).toHaveBeenCalled();
    await result.evidenceRecorded;
    expect(evidenceRecorded).toBe(true);
    const evidence = recordEvidence.mock.calls[0]?.[0];
    expect(evidence?.userId).toBe("u1");
    expect(evidence?.claimsReferenced).toEqual(["claim-1"]);
  });

  it("persists the conversation turn for memory", async () => {
    const storeConversation = vi.fn(async () => {});
    const agent = new CompanionAgent(fakeStream(["hi"]), {
      retrieveContext: async () => [],
      storeConversation,
      recordEvidence: async () => {},
    });
    await agent.execute({
      userId: "u1",
      conversationId: "c1",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(storeConversation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", conversationId: "c1" }),
    );
  });
});
