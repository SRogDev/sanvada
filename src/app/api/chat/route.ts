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
      `Te escucho. Dijiste: "${last?.content ?? ""}". ` +
      `Soy una compañera de demostración — conecta AI_GATEWAY_API_KEY para una conversación real. ` +
      `Lo que sé de ti hasta ahora vive en tu mapa personal; cuéntame más y aprenderé.`;
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

import { z } from "zod";
import { TokenBucket } from "@/infrastructure/security/rate-limit";

const chatLimiter = new TokenBucket({ limit: 20, windowMs: 60_000 });

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
});

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: Request) {
  const decision = chatLimiter.tryConsume(clientIp(req));
  if (!decision.allowed) {
    return Response.json(
      { error: "Demasiadas solicitudes. Por favor, ve más despacio." },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil(decision.retryAfterMs / 1000)),
        },
      },
    );
  }

  let parsed: z.infer<typeof ChatRequestSchema>;
  try {
    parsed = ChatRequestSchema.parse(await req.json());
  } catch {
    return Response.json(
      {
        error:
          "Solicitud inválida: messages debe tener 1-50 entradas, cada una con role y content (máx. 4000 caracteres).",
      },
      { status: 400 },
    );
  }

  const messages: StreamMessage[] = parsed.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let result: Awaited<ReturnType<CompanionAgent["execute"]>>;
  try {
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
    result = await agent.execute({
      userId: "demo-user",
      conversationId: "demo-conversation",
      messages,
    });
  } catch {
    // Never leak internals (stacks, keys) to the client.
    return Response.json(
      { error: "Algo salió mal. Por favor, inténtalo de nuevo." },
      { status: 500 },
    );
  }

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
