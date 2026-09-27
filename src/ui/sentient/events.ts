import type { SentientUIEvent } from "../../application/companion/ports";

export interface UiCardDescriptor {
  kind: "insight" | "reflection" | "experience" | "evolution";
  title: string;
  body: string;
}

/**
 * Fixed mapping from agent-emitted events to UI cards (PLAN §39).
 * Anything not in this table renders nothing — the AI cannot invent UI.
 */
export function describeEvent(event: SentientUIEvent): UiCardDescriptor | null {
  switch (event.type) {
    case "context_insight": {
      const p = event.payload as { summary?: string };
      return {
        kind: "insight",
        title: "I noticed something about you",
        body: typeof p.summary === "string" ? p.summary : "New insight",
      };
    }
    case "reflection_prompt": {
      const p = event.payload as { prompt?: string };
      return {
        kind: "reflection",
        title: "A moment to reflect",
        body: typeof p.prompt === "string" ? p.prompt : "What is on your mind?",
      };
    }
    case "experience_recommendation": {
      const p = event.payload as { title?: string; reason?: string };
      return {
        kind: "experience",
        title: typeof p.title === "string" ? p.title : "A new experience",
        body: typeof p.reason === "string" ? p.reason : "",
      };
    }
    case "self_map_update": {
      return {
        kind: "evolution",
        title: "Your self-map grew",
        body: "New evidence reshaped how I understand you.",
      };
    }
    default:
      return null;
  }
}

export interface ClaimNode {
  claimId: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  r: number;
}

/** Radial self-map layout: confident claims sit closer to the center. */
export function layoutClaims(
  claims: { claimId: string; summary: string; confidence: number }[],
): ClaimNode[] {
  const base = 120;
  return claims.map((c, i) => {
    const angle = (2 * Math.PI * i) / Math.max(claims.length, 1) - Math.PI / 2;
    const dist = base * (1.6 - c.confidence);
    return {
      claimId: c.claimId,
      label: c.summary,
      confidence: c.confidence,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      r: 10 + c.confidence * 14,
    };
  });
}
