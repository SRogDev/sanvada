import { afterEach, describe, expect, it } from "vitest";
import { ValidationError } from "../src/shared/errors";
import { createBrowserSupabaseClient } from "../src/infrastructure/database/client";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

describe("supabase client factory (Phase 1)", () => {
  const savedUrl = process.env[URL_KEY];
  const savedAnon = process.env[ANON_KEY];

  afterEach(() => {
    if (savedUrl === undefined) delete process.env[URL_KEY];
    else process.env[URL_KEY] = savedUrl;
    if (savedAnon === undefined) delete process.env[ANON_KEY];
    else process.env[ANON_KEY] = savedAnon;
  });

  it("fails fast with a clear error when Supabase is not configured", () => {
    delete process.env[URL_KEY];
    delete process.env[ANON_KEY];
    expect(() => createBrowserSupabaseClient()).toThrowError(ValidationError);
    expect(() => createBrowserSupabaseClient()).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("creates a client when the environment is configured", () => {
    process.env[URL_KEY] = "https://xyz.supabase.co";
    process.env[ANON_KEY] = "anon-key";
    const client = createBrowserSupabaseClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
