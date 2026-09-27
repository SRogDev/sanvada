import { describe, expect, it } from "vitest";
import { HumanContextEngine } from "../src/application/human-context/engine";
import type {
  ClaimInterpreterPort,
  ClaimProposal,
  ClaimWithVersions,
  HumanContextStore,
} from "../src/application/human-context/ports";
import type {
  Claim,
  ClaimEvidence,
  ClaimVersion,
  Evidence,
  HumanContextSnapshot,
  RelevanceStatus,
} from "../src/domains/human-context";
import type { UUID } from "../src/shared/types";

/** In-memory store: the engine's persistence boundary, faked. */
function createMemoryStore(): HumanContextStore & {
  evidence: Evidence[];
  claims: Map<UUID, { claim: Claim; versions: ClaimVersion[] }>;
  links: ClaimEvidence[];
  snapshots: HumanContextSnapshot[];
} {
  const evidence: Evidence[] = [];
  const claims = new Map<UUID, { claim: Claim; versions: ClaimVersion[] }>();
  const links: ClaimEvidence[] = [];
  const snapshots: HumanContextSnapshot[] = [];
  return {
    evidence,
    claims,
    links,
    snapshots,
    async saveEvidence(e) {
      evidence.push(e);
    },
    async updateEvidenceRelevance(id, status: RelevanceStatus) {
      const e = evidence.find((x) => x.id === id);
      if (e) e.relevanceStatus = status;
    },
    async getClaimsByUser() {
      return [...claims.values()].map(({ claim, versions }) => ({
        claim,
        versions: [...versions],
      }));
    },
    async saveClaim(c) {
      const existing = claims.get(c.id);
      claims.set(c.id, { claim: c, versions: existing?.versions ?? [] });
    },
    async saveClaimVersion(v) {
      const entry = claims.get(v.claimId);
      if (entry) entry.versions.push(v);
    },
    async saveClaimEvidence(l) {
      links.push(l);
    },
    async saveSnapshot(s) {
      snapshots.push(s);
    },
    async getLatestSnapshotVersion() {
      return snapshots.reduce((m, s) => Math.max(m, s.version), 0);
    },
  };
}

/**
 * Fake interpreter driving the synthetic acceptance scenario:
 * - night-walk love → new preference claim (observed)
 * - night-walk rejection (user_correction) → contradicts the existing claim
 * - anything else → irrelevant
 */
function createFakeInterpreter(): ClaimInterpreterPort {
  return {
    async assessRelevance(evidence) {
      const t = evidence.content.toLowerCase();
      if (t.includes("night walk") || t.includes("morning")) {
        return { relevant: true, reason: "preference signal" };
      }
      return { relevant: false, reason: "no human-context signal" };
    },
    async proposeClaims(evidence, related: ClaimWithVersions[]) {
      const t = evidence.content.toLowerCase();
      const pref = related.find((r) => r.claim.category === "preference");
      if (t.includes("can't stand night walks")) {
        const proposals: ClaimProposal[] = [];
        if (pref) {
          proposals.push({
            category: "preference",
            claimText: "Now prefers mornings; dislikes night walks",
            status: "inferred",
            confidence: 0.8,
            reason: "explicit correction",
            relatedClaimId: pref.claim.id,
          });
        }
        return proposals;
      }
      if (t.includes("love night walks")) {
        return [
          {
            category: "preference",
            claimText: "Loves night walks",
            status: "observed",
            confidence: 0.5,
            reason: "stated directly",
            relatedClaimId: null,
          },
        ];
      }
      return [];
    },
    async compareClaims(a, b) {
      if (
        a.toLowerCase().includes("dislikes") &&
        b.toLowerCase().includes("loves")
      ) {
        return "contradicts";
      }
      return "supports";
    },
  };
}

const userId = "77777777-7777-4777-8777-777777777777";

async function process(
  content: string,
  sourceType: "conversation" | "user_correction" = "conversation",
) {
  const store = createMemoryStore();
  const engine = new HumanContextEngine(store, createFakeInterpreter());
  // seed the contradiction scenario when needed via two calls in the test
  const events = await engine.processEvidence({ userId, sourceType, content });
  return { store, events };
}

describe("HumanContextEngine (PLAN §24)", () => {
  it("creates evidence and a new claim from a relevant message", async () => {
    const { store, events } = await process(
      "I love night walks, they clear my head",
    );
    expect(store.evidence).toHaveLength(1);
    const ev0 = store.evidence[0];
    expect(ev0).toBeDefined();
    expect(ev0?.relevanceStatus).toBe("processed");
    expect(store.claims.size).toBe(1);
    const first = [...store.claims.values()][0];
    expect(first).toBeDefined();
    expect(first?.versions).toHaveLength(1);
    expect(first?.versions[0]?.claimText).toBe("Loves night walks");
    expect(first?.claim.currentStatus).toBe("observed");
    expect(events.some((e) => e.type === "claim_created")).toBe(true);
  });

  it("marks irrelevant messages without creating claims", async () => {
    const { store, events } = await process("what's the weather like");
    const ev = store.evidence[0];
    expect(ev).toBeDefined();
    expect(ev?.relevanceStatus).toBe("irrelevant");
    expect(store.claims.size).toBe(0);
    expect(events.some((e) => e.type === "evidence_irrelevant")).toBe(true);
  });

  it("ACCEPTANCE: synthetic contradiction preserves historical claims (§26)", async () => {
    const store = createMemoryStore();
    const engine = new HumanContextEngine(store, createFakeInterpreter());

    await engine.processEvidence({
      userId,
      sourceType: "conversation",
      content: "I love night walks, they clear my head",
    });
    const seeded = [...store.claims.values()][0];
    expect(seeded).toBeDefined();
    const claim = seeded?.claim;
    const v1Text = seeded?.versions[0]?.claimText;
    expect(claim).toBeDefined();

    await engine.processEvidence({
      userId,
      sourceType: "user_correction",
      content: "Actually I can't stand night walks anymore, I prefer mornings",
    });

    const entry = claim ? store.claims.get(claim.id) : undefined;
    expect(entry).toBeDefined();
    // history preserved: v1 untouched, v2 supersedes it
    const versions = entry?.versions ?? [];
    expect(versions).toHaveLength(2);
    const v1 = versions[0];
    const v2 = versions[1];
    expect(v1?.claimText).toBe(v1Text);
    expect(v1?.status).toBe("observed");
    expect(v2?.supersedesVersionId).toBe(v1?.id);
    // user correction wins deterministically
    expect(entry?.claim.currentStatus).toBe("user_confirmed");
    // contradiction link recorded
    expect(
      store.links.some(
        (l) => l.claimId === claim?.id && l.relationship === "contradicts",
      ),
    ).toBe(true);
    // major update → snapshot created
    expect(store.snapshots).toHaveLength(1);
    const snapshot = store.snapshots[0];
    expect(snapshot).toBeDefined();
    expect(snapshot?.trigger).toBe("major_update");
    const latestVersion = entry?.versions[1];
    expect(latestVersion).toBeDefined();
    expect(snapshot?.snapshotData.claimVersions).toContain(latestVersion?.id);
  });
});
