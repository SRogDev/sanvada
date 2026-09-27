/**
 * In-memory token-bucket rate limiter (Phase 15 hardening).
 *
 * Single-instance scope: correct for a single-server deployment. A
 * multi-instance deployment must move this to Redis — the interface
 * (tryConsume) is already shaped for that swap.
 */
export interface RateLimitConfig {
  /** Max requests per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

interface Bucket {
  tokens: number;
  windowStart: number;
}

export class TokenBucket {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly config: RateLimitConfig) {}

  tryConsume(key: string): RateLimitDecision {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= this.config.windowMs) {
      bucket = { tokens: this.config.limit, windowStart: now };
      this.buckets.set(key, bucket);
    }
    if (bucket.tokens <= 0) {
      return {
        allowed: false,
        retryAfterMs: bucket.windowStart + this.config.windowMs - now,
      };
    }
    bucket.tokens -= 1;
    return { allowed: true, retryAfterMs: 0 };
  }
}
