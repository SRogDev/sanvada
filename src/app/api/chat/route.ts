import { CompanionAgent } from "@/application/companion/companion";
import type {
  StreamMessage,
  TextStreamPort,
} from "@/application/companion/ports";
import { AiSdkStreamPort } from "@/infrastructure/llm/ai-sdk-stream";
import { demoClaims } from "@/ui/demo";

/**
 * Demo stream port — used ONLY when no AI_GATEWAY_API_KEY is configured.
 * Clearly labeled; production uses AiSdkStreamPort through Mind.dispatch.
 */
class DemoStreamPort implements TextStreamPort {
  async *stream(params: {
    system: string;
    messages: StreamMessage[];
  }): AsyncIterable<string> {
    const last = [...params.messages].reverse().find((m) => m.role === "user");
    const text =
      `I hear you. You said: "${last?.content ?? ""}". ` +
      `This is a demo companion — connect AI_GATEWAY_API_KEY for real conversation. ` +
      `What I know about you so far lives in your self-map; tell me more and I'll learn.`;
    for (const word of text.split(" ")) {
      yield `${word} `;
      await new Promise((r) => setTimeout(r, 24));
    }
  }
}

function streamPort(): TextStreamPort {
  if (process.env.AI_GATEWAY_API_KEY) return new AiSdkStreamPort();
  return new DemoStreamPort();
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: StreamMessage[] };
  const agent = new CompanionAgent(streamPort(), {
    retrieveContext: async () =>
      demoClaims.map((c) => ({
        claimId: c.claimId,
        currentVersion: "v1",
        summary: c.summary,
        confidence: c.confidence,
        relevance: c.confidence,
      })),
    storeConversation: async () => {},
    recordEvidence: async () => {},
  });
  const result = await agent.execute({
    userId: "demo-user",
    conversationId: "demo-conversation",
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: ui\ndata: ${JSON.stringify(result.uiEvents)}\n\n`,
        ),
      );
      // Re-stream from the completed text: execute() already consumed the
      // port stream; chunk the text for progressive rendering.
      for (const word of result.text.split(" ")) {
        controller.enqueue(encoder.encode(`event: chunk\ndata: ${word} \n\n`));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
}
