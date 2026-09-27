import { demoClaims } from "@/ui/demo";
import { layoutClaims } from "@/ui/sentient/events";
import { Shell } from "@/ui/shell";

export default function SelfMapPage() {
  const nodes = layoutClaims(demoClaims);
  const W = 360;
  const H = 360;
  return (
    <Shell>
      <div className="pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--color-secondary)">
          “Así te veo”
        </p>
        <h1 className="font-heading text-glow mt-2 text-4xl font-semibold tracking-tight">
          Tu mapa personal
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-(--color-muted-foreground)">
          Lo que creo saber de ti hasta ahora. Más cerca del centro significa
          más confianza. Corrígeme cuando quieras — esta representación es tuya.
        </p>

        <div className="glass relative mt-8 overflow-hidden rounded-[2rem] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.4)]">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-primary) opacity-[0.12] blur-3xl"
          />
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="relative mx-auto w-full max-w-md"
            role="img"
            aria-label="Mapa personal de afirmaciones"
          >
            <defs>
              <filter
                id="nodeGlow"
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {nodes.map((n) => (
              <g
                key={n.claimId}
                transform={`translate(${W / 2 + n.x}, ${H / 2 + n.y})`}
              >
                <circle
                  r={n.r}
                  fill="rgba(139,124,246,0.06)"
                  stroke="var(--color-secondary)"
                  strokeWidth="1.5"
                  opacity={0.3 + n.confidence * 0.7}
                  filter="url(#nodeGlow)"
                />
                <circle r={4} fill="var(--color-secondary)" opacity={0.95} />
                <text
                  y={n.r + 17}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-muted-foreground)"
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ul className="mt-6 grid gap-3">
          {demoClaims.map((c) => (
            <li
              key={c.claimId}
              className="glass flex items-center justify-between rounded-2xl px-5 py-4 transition-colors duration-200 hover:bg-white/[0.07]"
            >
              <span className="font-heading text-[17px]">{c.summary}</span>
              <span className="font-heading text-lg text-(--color-secondary)">
                {Math.round(c.confidence * 100)}
                <span className="text-sm text-(--color-muted-foreground)">
                  %
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
