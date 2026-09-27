/**
 * Phase 15 — Hardening (PLAN §43).
 * Rate limiter unit tests + /api/chat validation tests.
 */
import { describe, expect, it, vi } from "vitest";
import { TokenBucket } from "../src/infrastructure/security/rate-limit.js";

describe("TokenBucket", () => {
  it("allows up to the limit, then blocks", () => {
    const bucket = new TokenBucket({ limit: 3, windowMs: 60_000 });
    expect(bucket.tryConsume("ip-1").allowed).toBe(true);
    expect(bucket.tryConsume("ip-1").allowed).toBe(true);
    expect(bucket.tryConsume("ip-1").allowed).toBe(true);
    const denied = bucket.tryConsume("ip-1");
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks buckets independently per key", () => {
    const bucket = new TokenBucket({ limit: 1, windowMs: 60_000 });
    expect(bucket.tryConsume("a").allowed).toBe(true);
    expect(bucket.tryConsume("a").allowed).toBe(false);
    expect(bucket.tryConsume("b").allowed).toBe(true);
  });

  it("refills after the window passes", () => {
    vi.useFakeTimers();
    const bucket = new TokenBucket({ limit: 1, windowMs: 60_000 });
    expect(bucket.tryConsume("ip").allowed).toBe(true);
    expect(bucket.tryConsume("ip").allowed).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(bucket.tryConsume("ip").allowed).toBe(true);
    vi.useRealTimers();
  });
});

describe("POST /api/chat hardening", () => {
  it("rejects non-JSON / malformed bodies with 400", async () => {
    const { POST } = await import("../src/app/api/chat/route.js");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects oversized messages with 400", async () => {
    const { POST } = await import("../src/app/api/chat/route.js");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "x".repeat(4001) }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it(
    "rate-limits repeated requests from one client",
    async () => {
    const { POST } = await import("../src/app/api/chat/route.js");
    const make = () =>
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "10.0.0.99",
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
      });
    let saw429 = false;
    for (let i = 0; i < 25; i++) {
      const res = await POST(make());
      if (res.status === 429) {
        saw429 = true;
        break;
      }
      // Consume the stream so handlers finish cleanly.
      if (res.body) await res.body.cancel();
    }
    expect(saw429).toBe(true);
  },
  60_000,
  );
});
