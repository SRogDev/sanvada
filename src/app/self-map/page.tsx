import { demoClaims } from "@/ui/demo";
import { layoutClaims } from "@/ui/sentient/events";
import { Shell } from "@/ui/shell";

export default function SelfMapPage() {
  const nodes = layoutClaims(demoClaims);
  const W = 360;
  const H = 360;
  return (
    <Shell>
      <div className="pt-6">
        <p className="text-sm uppercase tracking-widest text-(--color-muted-foreground)">
          “Así te veo”
        </p>
        <h1 className="font-heading mt-1 text-3xl font-semibold">
          Your Self Map
        </h1>
        <p className="mt-2 text-[15px] text-(--color-muted-foreground)">
          What I believe about you so far. Closer to the center means more
          confident. Correct me anytime — you own this representation.
        </p>
        <div className="mt-6 rounded-3xl border border-(--color-border) bg-(--color-card) p-4">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mx-auto w-full max-w-md"
            role="img"
            aria-label="Self map of claims"
          >
            {nodes.map((n) => (
              <g
                key={n.claimId}
                transform={`translate(${W / 2 + n.x}, ${H / 2 + n.y})`}
              >
                <circle
                  r={n.r}
                  fill="none"
                  stroke="var(--color-secondary)"
                  strokeWidth="2"
                  opacity={0.35 + n.confidence * 0.65}
                />
                <circle r={4} fill="var(--color-accent)" opacity={0.9} />
                <text
                  y={n.r + 16}
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
              className="flex items-center justify-between rounded-2xl border border-(--color-border) bg-(--color-card) px-4 py-3"
            >
              <span className="font-heading text-[17px]">{c.summary}</span>
              <span className="text-sm text-(--color-muted-foreground)">
                {Math.round(c.confidence * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
