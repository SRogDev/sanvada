/**
 * API v1 — understanding pipeline (docs/UNDERSTANDING.md).
 * RED: store + heuristic MODEL step behind contracts.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  MemoryUnderstandingStore,
  UNDERSTAND_MODEL_VERSION,
  understandUser,
} from "../src/application/understanding/index.js";

describe("MemoryUnderstandingStore", () => {
  let store: MemoryUnderstandingStore;
  beforeEach(async () => {
    store = new MemoryUnderstandingStore();
    await store.reset();
  });

  it("appends evidence and lists it per user", async () => {
    const created = await store.appendEvidence([
      {
        userId: "u1",
        sourceType: "conversation",
        content: "me gustan las mañanas",
        structuredData: null,
      },
      {
        userId: "u1",
        sourceType: "user_correction",
        content: "no, prefiero las noches",
        structuredData: null,
      },
    ]);
    expect(created).toHaveLength(2);
    expect(created[0]!.id).toBeTruthy();
    const listed = await store.listEvidence("u1");
    expect(listed).toHaveLength(2);
    expect(await store.listEvidence("u2")).toHaveLength(0);
  });

  it("isolates users from each other", async () => {
    await store.appendEvidence([
      {
        userId: "u1",
        sourceType: "conversation",
        content: "a",
        structuredData: null,
      },
      {
        userId: "u2",
        sourceType: "conversation",
        content: "b",
        structuredData: null,
      },
    ]);
    expect(await store.listEvidence("u1")).toHaveLength(1);
    expect(await store.listEvidence("u2")).toHaveLength(1);
  });

  it("reset clears all state", async () => {
    await store.appendEvidence([
      {
        userId: "u1",
        sourceType: "conversation",
        content: "a",
        structuredData: null,
      },
    ]);
    await store.reset();
    expect(await store.listEvidence("u1")).toHaveLength(0);
  });
});

describe("understandUser (heuristic v0)", () => {
  let store: MemoryUnderstandingStore;
  beforeEach(async () => {
    store = new MemoryUnderstandingStore();
    await store.reset();
  });

  it("emits one low-confidence uncertainty claim per evidence source type", async () => {
    await store.appendEvidence([
      {
        userId: "u1",
        sourceType: "conversation",
        content: "hola",
        structuredData: null,
      },
      {
        userId: "u1",
        sourceType: "conversation",
        content: "adiós",
        structuredData: null,
      },
      {
        userId: "u1",
        sourceType: "user_correction",
        content: "no",
        structuredData: null,
      },
    ]);
    const result = await understandUser(store, "u1");
    expect(result.userId).toBe("u1");
    expect(result.modelVersion).toBe(UNDERSTAND_MODEL_VERSION);
    expect(result.claims).toHaveLength(2);
    for (const c of result.claims) {
      expect(c.category).toBe("uncertainty");
      expect(c.status).toBe("observed");
      expect(c.confidence).toBe(0.3);
    }
    const conv = result.claims.find((c) => c.text.includes("conversación"));
    expect(conv!.evidenceCount).toBe(2);
  });

  it("returns no claims for a user with no evidence", async () => {
    const result = await understandUser(store, "ghost");
    expect(result.claims).toHaveLength(0);
  });

  it("persists claims so understand is repeatable", async () => {
    await store.appendEvidence([
      {
        userId: "u1",
        sourceType: "assessment",
        content: "x",
        structuredData: null,
      },
    ]);
    await understandUser(store, "u1");
    expect(await store.listClaims("u1")).toHaveLength(1);
  });
});
