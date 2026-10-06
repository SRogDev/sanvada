/**
 * API v1 route tests — auth, validation, and the ingest→understand→select loop.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as ingest } from "../src/app/api/v1/ingest/route.js";
import { POST as select } from "../src/app/api/v1/select/route.js";
import { POST as understand } from "../src/app/api/v1/understand/route.js";
import { getUnderstandingStore } from "../src/application/understanding/index.js";

const KEY = "test-api-key-123";

function req(body: unknown, withKey = true): Request {
  return new Request("http://localhost/api/v1/x", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withKey ? { "x-api-key": KEY } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("API v1 auth", () => {
  const saved = process.env.SANVADA_API_KEY;
  beforeEach(() => {
    process.env.SANVADA_API_KEY = KEY;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.SANVADA_API_KEY;
    else process.env.SANVADA_API_KEY = saved;
  });

  it("rejects requests without a valid x-api-key (401)", async () => {
    const res = await ingest(req({ userId: "u", events: [] }, false));
    expect(res.status).toBe(401);
  });

  it("rejects a wrong key (401)", async () => {
    const r = new Request("http://localhost/api/v1/x", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "wrong" },
      body: JSON.stringify({ userId: "u" }),
    });
    expect((await understand(r)).status).toBe(401);
  });

  it("fails fast when SANVADA_API_KEY is not configured (503)", async () => {
    delete process.env.SANVADA_API_KEY;
    const res = await ingest(req({ userId: "u", events: [] }));
    expect(res.status).toBe(503);
  });
});

describe("API v1 pipeline", () => {
  beforeEach(async () => {
    process.env.SANVADA_API_KEY = KEY;
    await getUnderstandingStore().reset();
  });
  afterEach(() => {
    delete process.env.SANVADA_API_KEY;
  });

  it("ingest → understand → select completes the loop", async () => {
    const ing = await ingest(
      req({
        userId: "u1",
        events: [
          { sourceType: "conversation", content: "me gustan las mañanas" },
          { sourceType: "user_correction", content: "mejor de noche" },
        ],
      }),
    );
    expect(ing.status).toBe(200);
    const ingBody = (await ing.json()) as { count: number };
    expect(ingBody.count).toBe(2);

    const und = await understand(req({ userId: "u1" }));
    expect(und.status).toBe(200);
    const undBody = (await und.json()) as {
      claims: { confidence: number }[];
      modelVersion: string;
    };
    expect(undBody.claims).toHaveLength(2);
    expect(undBody.modelVersion).toBe("understand-heuristic-0.1.0");

    const sel = await select(
      req({
        userId: "u1",
        candidates: [
          { experienceId: "exp-a", fit: 0.9, novelty: 0.5, risk: "low" },
          { experienceId: "exp-b", fit: 0.4, novelty: 0.9, risk: "high" },
        ],
      }),
    );
    expect(sel.status).toBe(200);
    const selBody = (await sel.json()) as {
      selections: { experienceId: string; inputHash: string }[];
      selectionModelVersion: string;
      contextSnapshotId: string;
    };
    expect(selBody.selections[0]!.experienceId).toBe("exp-a");
    expect(selBody.selectionModelVersion).toBe("heuristic-1.0.0");
    expect(selBody.contextSnapshotId).toHaveLength(16);
    expect(selBody.selections[0]!.inputHash).toHaveLength(64);
  });

  it("validates bodies (400 on bad input)", async () => {
    expect((await ingest(req({ userId: "u1", events: [] }))).status).toBe(400);
    expect(
      (
        await ingest(
          req({ userId: "u1", events: [{ sourceType: "nope", content: "x" }] }),
        )
      ).status,
    ).toBe(400);
    expect((await understand(req({}))).status).toBe(400);
    expect((await select(req({ userId: "u1", candidates: [] }))).status).toBe(
      400,
    );
  });

  it("keeps users isolated through the API", async () => {
    await ingest(
      req({
        userId: "alice",
        events: [{ sourceType: "conversation", content: "hola" }],
      }),
    );
    const bob = (await (await understand(req({ userId: "bob" }))).json()) as {
      claims: unknown[];
    };
    expect(bob.claims).toHaveLength(0);
  });
});
