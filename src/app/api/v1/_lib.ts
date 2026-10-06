import { z } from "zod";
import { TokenBucket } from "@/infrastructure/security/rate-limit";

/**
 * Shared v1 API plumbing: key auth, rate limiting, client identity.
 * Developer-facing errors are in English (B2B API); the consumer app stays Spanish.
 */

const apiLimiter = new TokenBucket({ limit: 60, windowMs: 60_000 });

export function clientId(req: Request): string {
  const key = req.headers.get("x-api-key");
  if (key) return `key:${key.slice(0, 8)}`;
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Returns an error Response, or null when the request is authorized. */
export function requireApiKey(req: Request): Response | null {
  const configured = process.env.SANVADA_API_KEY;
  if (!configured) {
    return Response.json(
      {
        error:
          "API not configured: set SANVADA_API_KEY on the server. See docs/API.md.",
      },
      { status: 503 },
    );
  }
  const provided = req.headers.get("x-api-key");
  if (!provided || provided !== configured) {
    return Response.json(
      { error: "Unauthorized: valid x-api-key header required." },
      { status: 401 },
    );
  }
  const decision = apiLimiter.tryConsume(clientId(req));
  if (!decision.allowed) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil(decision.retryAfterMs / 1000)),
        },
      },
    );
  }
  return null;
}

export const UserIdSchema = z.string().min(1).max(128);

export function invalidBody(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function toJson<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}
