import { describe, expect, it, vi } from "vitest";
import { MemoryPipeline } from "../src/infrastructure/memory/pipeline";
import type {
  MemoryDocument,
  SemanticMemoryPort,
} from "../src/infrastructure/memory/ports";
import { withGracefulDegradation } from "../src/infrastructure/memory/resilient-memory";
import { SupermemoryAdapter } from "../src/infrastructure/memory/supermemory-adapter";
import { ProviderUnavailableError } from "../src/shared/errors";

const doc = (content: string): MemoryDocument => ({
  userId: "u1",
  content,
});

function recordingPort(): SemanticMemoryPort & { indexed: MemoryDocument[] } {
  const indexed: MemoryDocument[] = [];
  return {
    indexed,
    async index(d) {
      indexed.push(d);
    },
    async search() {
      return [{ content: "hit", score: 0.9, metadata: {} }];
    },
  };
}

function failingPort(): SemanticMemoryPort {
  return {
    async index() {
      throw new ProviderUnavailableError("supermemory", "boom");
    },
    async search() {
      throw new ProviderUnavailableError("supermemory", "boom");
    },
  };
}

describe("Memory (PLAN Phase 4)", () => {
  it("ACCEPTANCE: semantic memory failure does not break the product", async () => {
    const onError = vi.fn();
    const memory = withGracefulDegradation(failingPort(), onError);
    // search degrades to empty, index degrades to no-op — neither throws
    await expect(memory.search("u1", "night walks")).resolves.toEqual([]);
    await expect(memory.index(doc("hello"))).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("passes through results when the provider is healthy", async () => {
    const memory = withGracefulDegradation(recordingPort());
    const hits = await memory.search("u1", "night walks");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.content).toBe("hit");
  });

  it("pipeline indexes asynchronously without blocking the caller", async () => {
    const port = recordingPort();
    const pipeline = new MemoryPipeline(port);
    pipeline.enqueue(doc("a"));
    pipeline.enqueue(doc("b"));
    // enqueue returns immediately; nothing indexed yet
    expect(port.indexed).toHaveLength(0);
    await pipeline.drain();
    expect(port.indexed.map((d) => d.content)).toEqual(["a", "b"]);
  });

  it("one failing document does not block the rest of the pipeline", async () => {
    const port = recordingPort();
    const bad: SemanticMemoryPort = {
      ...port,
      async index(d) {
        if (d.content === "bad") throw new Error("index failed");
        return port.index(d);
      },
    };
    const pipeline = new MemoryPipeline(bad);
    pipeline.enqueue(doc("good-1"));
    pipeline.enqueue(doc("bad"));
    pipeline.enqueue(doc("good-2"));
    await pipeline.drain();
    expect(port.indexed.map((d) => d.content)).toEqual(["good-1", "good-2"]);
    expect(pipeline.failed).toHaveLength(1);
    expect(pipeline.failed[0]?.document.content).toBe("bad");
  });

  it("adapter fails fast with a clear message when unconfigured", async () => {
    const adapter = new SupermemoryAdapter({ apiKey: undefined });
    await expect(adapter.index(doc("x"))).rejects.toThrowError(
      ProviderUnavailableError,
    );
    await expect(adapter.index(doc("x"))).rejects.toThrowError(
      /SUPERMEMORY_API_KEY/,
    );
  });
});
