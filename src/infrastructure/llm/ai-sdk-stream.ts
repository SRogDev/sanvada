import { createGateway, streamText } from "ai";
import type {
  StreamParams,
  TextStreamPort,
} from "../../application/companion/ports";

/**
 * AI SDK implementation of the streaming port (PLAN §30, AI Gateway as
 * default seam). Model is swappable; the research-tuned production model
 * will sit behind the same interface.
 */
export class AiSdkStreamPort implements TextStreamPort {
  private readonly gateway;

  constructor(private readonly modelId = "openai/gpt-4o-mini") {
    this.gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
  }

  async *stream(params: StreamParams): AsyncIterable<string> {
    const result = streamText({
      model: this.gateway(this.modelId),
      system: params.system,
      messages: params.messages,
    });
    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}
