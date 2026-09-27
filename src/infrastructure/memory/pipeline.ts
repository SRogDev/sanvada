import type { MemoryDocument, SemanticMemoryPort } from "./ports";

export interface FailedDocument {
  document: MemoryDocument;
  error: unknown;
}

/**
 * Async indexing pipeline (PLAN §25).
 *
 * enqueue() returns immediately — the conversation never waits for
 * semantic indexing. drain() processes jobs sequentially; a failing
 * document is recorded in `failed` and never blocks the rest.
 */
export class MemoryPipeline {
  private readonly queue: MemoryDocument[] = [];
  readonly failed: FailedDocument[] = [];

  constructor(private readonly port: SemanticMemoryPort) {}

  enqueue(document: MemoryDocument): void {
    this.queue.push(document);
  }

  get size(): number {
    return this.queue.length;
  }

  async drain(): Promise<void> {
    while (this.queue.length > 0) {
      const document = this.queue.shift();
      if (!document) break;
      try {
        await this.port.index(document);
      } catch (error) {
        this.failed.push({ document, error });
      }
    }
  }
}
