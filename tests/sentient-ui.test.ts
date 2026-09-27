/**
 * Phase 9 — Sentient UI (PLAN §33).
 *
 * The AI never generates arbitrary frontend code: every contextual
 * UI object comes from a validated SentientUIEvent mapped through
 * a fixed, reviewable descriptor table.
 */
import { describe, expect, it } from "vitest";
import { describeEvent, layoutClaims } from "../src/ui/sentient/events.js";

describe("Sentient UI event mapping", () => {
  it("maps a context_insight event to an insight card descriptor", () => {
    const card = describeEvent({
      type: "context_insight",
      payload: {
        claimId: "claim-1",
        summary: "Loves night walks",
        confidence: 0.9,
      },
    });
    expect(card).toMatchObject({
      kind: "insight",
      title: "I noticed something about you",
      body: "Loves night walks",
    });
  });

  it("maps a reflection_prompt event to a reflection card", () => {
    const card = describeEvent({
      type: "reflection_prompt",
      payload: { prompt: "What did today teach you?" },
    });
    expect(card).toMatchObject({
      kind: "reflection",
      title: "A moment to reflect",
    });
  });

  it("refuses unknown event types — no arbitrary UI generation", () => {
    const card = describeEvent({
      // @ts-expect-error — adversarial: forged event type
      type: "execute_arbitrary_code",
      payload: {},
    });
    expect(card).toBeNull();
  });
});

describe("Self-map layout", () => {
  it("places claims on a radial layout, radius scaled by confidence", () => {
    const nodes = layoutClaims([
      { claimId: "a", summary: "A", confidence: 1 },
      { claimId: "b", summary: "B", confidence: 0.5 },
    ]);
    expect(nodes).toHaveLength(2);
    const [na, nb] = nodes;
    const dist = (n: { x: number; y: number }) => Math.hypot(n.x, n.y);
    // Confident claims sit closer to the center.
    expect(dist(na!)).toBeLessThan(dist(nb!));
    expect(na!.label).toBe("A");
  });
});
