import { ProviderUnavailableError } from "@/shared/errors";
import type { MemoryDocument, MemoryHit, SemanticMemoryPort } from "./ports";

/**
 * Supermemory adapter (PLAN Phase 4).
 *
 * API shape follows Supermemory v3 (x-api-key header, /v3/documents,
 * /v3/search); the base URL is configurable so the adapter survives API
 * revisions without code changes. Documents are scoped per user with a
 * container tag — semantic memory must never leak across users.
 */
export class SupermemoryAdapter implements SemanticMemoryPort {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = options?.apiKey ?? process.env.SUPERMEMORY_API_KEY;
    this.baseUrl = options?.baseUrl ?? "https://api.supermemory.ai";
  }

  private requireKey(): string {
    if (!this.apiKey) {
      throw new ProviderUnavailableError(
        "supermemory",
        "Supermemory is not configured: set SUPERMEMORY_API_KEY.",
      );
    }
    return this.apiKey;
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    const apiKey = this.requireKey();
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      throw new ProviderUnavailableError(
        "supermemory",
        `Supermemory request failed: ${(cause as Error).message}`,
      );
    }
    if (!response.ok) {
      throw new ProviderUnavailableError(
        "supermemory",
        `Supermemory request failed with status ${response.status}.`,
      );
    }
    return response.json() as Promise<unknown>;
  }

  async index(document: MemoryDocument): Promise<void> {
    await this.post("/v3/documents", {
      content: document.content,
      containerTags: [`sanvada:${document.userId}`],
      metadata: document.metadata ?? {},
    });
  }

  async search(userId: string, query: string, limit = 5): Promise<MemoryHit[]> {
    const raw = (await this.post("/v3/search", {
      q: query,
      containerTags: [`sanvada:${userId}`],
      limit,
    })) as {
      results?: Array<{
        content?: string;
        score?: number;
        metadata?: Record<string, unknown>;
      }>;
    };
    return (raw.results ?? []).map((r) => ({
      content: r.content ?? "",
      score: r.score ?? 0,
      metadata: r.metadata ?? {},
    }));
  }
}
