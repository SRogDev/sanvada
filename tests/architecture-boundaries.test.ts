import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// PLAN §4 — Domain dependency rules. The domain layer must NOT depend on
// Next.js, React, the Supabase SDK, the Vercel AI SDK, Supermemory, or any
// infrastructure module. This test scans every domain file and fails the
// build if a boundary is crossed.

const here = dirname(fileURLToPath(import.meta.url));
const DOMAINS_DIR = join(here, "..", "src", "domains");

const FORBIDDEN: Array<{ name: string; pattern: RegExp }> = [
  { name: "next", pattern: /from\s+["']next(\/|["'])/ },
  { name: "react", pattern: /from\s+["']react(\/|["'])/ },
  { name: "supabase", pattern: /from\s+["']@supabase\// },
  { name: "ai-sdk", pattern: /from\s+["']ai(\/|["'])/ },
  { name: "supermemory", pattern: /supermemory/i },
  { name: "infrastructure", pattern: /from\s+["']@\/infrastructure\// },
];

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("architecture boundaries (PLAN §4)", () => {
  it("domain layer has zero forbidden imports", () => {
    const violations: string[] = [];
    for (const file of collectTsFiles(DOMAINS_DIR)) {
      const content = readFileSync(file, "utf-8");
      for (const { name, pattern } of FORBIDDEN) {
        if (pattern.test(content)) {
          violations.push(`${file} imports forbidden dependency: ${name}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
