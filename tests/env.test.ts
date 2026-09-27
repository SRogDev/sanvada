import { describe, expect, it } from "vitest";
import { envSchema } from "../src/shared/schemas/env";

describe("env schema (PLAN §5: environment variables via Zod)", () => {
  it("parses an empty environment (all vars optional until their phase lands)", () => {
    const parsed = envSchema.parse({});
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(parsed.AI_GATEWAY_API_KEY).toBeUndefined();
  });

  it("accepts a fully populated environment", () => {
    const parsed = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: "https://xyz.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      AI_GATEWAY_API_KEY: "gw-key",
      SUPERMEMORY_API_KEY: "sm-key",
    });
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe("https://xyz.supabase.co");
  });

  it("rejects a malformed Supabase URL instead of failing at runtime", () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
