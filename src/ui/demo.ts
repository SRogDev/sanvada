/**
 * Demo data for the Sentient UI until Supabase is wired.
 * Clearly labeled; replaced by live queries in production.
 */
export const demoClaims = [
  { claimId: "claim-1", summary: "Ama los paseos nocturnos", confidence: 0.92 },
  { claimId: "claim-2", summary: "Aprende construyendo", confidence: 0.88 },
  { claimId: "claim-3", summary: "Recarga en soledad", confidence: 0.74 },
  { claimId: "claim-4", summary: "Piensa en sistemas", confidence: 0.81 },
  {
    claimId: "claim-5",
    summary: "Siente en español",
    confidence: 0.66,
  },
];

export const demoExperiences = [
  {
    id: "exp-1",
    title: "Un paseo silencioso por la mañana",
    reason: "Piensas con claridad cuando te mueves. Sin teléfono, 20 minutos.",
    status: "proposed" as const,
  },
  {
    id: "exp-2",
    title: "Escribe una página sobre hoy",
    reason: "La reflexión convierte la experiencia en comprensión.",
    status: "proposed" as const,
  },
];

export const demoSnapshots = [
  {
    id: "snap-1",
    createdAt: "2026-09-20",
    summary: "Primera conversación — 3 afirmaciones abiertas",
    kind: "minor" as const,
  },
  {
    id: "snap-2",
    createdAt: "2026-09-24",
    summary: "Corrección sobre soledad vs. aislamiento — 1 afirmación superada",
    kind: "major" as const,
  },
  {
    id: "snap-3",
    createdAt: "2026-09-27",
    summary: "Identidad de constructor confirmada — confianza elevada",
    kind: "minor" as const,
  },
];
