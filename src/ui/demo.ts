/**
 * Demo data for the Sentient UI until Supabase is wired.
 * Clearly labeled; replaced by live queries in production.
 */
export const demoClaims = [
  { claimId: "claim-1", summary: "Loves night walks", confidence: 0.92 },
  { claimId: "claim-2", summary: "Learns by building", confidence: 0.88 },
  { claimId: "claim-3", summary: "Recharges in solitude", confidence: 0.74 },
  { claimId: "claim-4", summary: "Thinks in systems", confidence: 0.81 },
  {
    claimId: "claim-5",
    summary: "Prefers Spanish for feelings",
    confidence: 0.66,
  },
];

export const demoExperiences = [
  {
    id: "exp-1",
    title: "A silent morning walk",
    reason: "You think clearly when you move. No phone, 20 minutes.",
    status: "proposed" as const,
  },
  {
    id: "exp-2",
    title: "Write one page about today",
    reason: "Reflection turns experience into understanding.",
    status: "proposed" as const,
  },
];

export const demoSnapshots = [
  {
    id: "snap-1",
    createdAt: "2026-09-20",
    summary: "First conversation — 3 claims opened",
    kind: "minor" as const,
  },
  {
    id: "snap-2",
    createdAt: "2026-09-24",
    summary: "Correction on solitude vs. loneliness — 1 claim superseded",
    kind: "major" as const,
  },
  {
    id: "snap-3",
    createdAt: "2026-09-27",
    summary: "Building identity confirmed — confidence raised",
    kind: "minor" as const,
  },
];
