import { demoSnapshots } from "@/ui/demo";
import { Shell } from "@/ui/shell";

const kindLabel: Record<string, string> = {
  minor: "cambio menor",
  major: "cambio mayor",
};

export default function EvolutionPage() {
  return (
    <Shell>
      <div className="pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--color-secondary)">
          Cómo cambió tu contexto
        </p>
        <h1 className="font-heading text-glow mt-2 text-4xl font-semibold tracking-tight">
          Evolución
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-(--color-muted-foreground)">
          Instantáneas de cómo te he entendido con el tiempo. Nada se
          sobrescribe — cada versión permanece.
        </p>

        <ol className="mt-10 grid gap-0">
          {demoSnapshots.map((s, i) => (
            <li key={s.id} className="relative pl-10 pb-10 last:pb-0">
              {i < demoSnapshots.length - 1 && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-[9px] top-8 w-px bg-gradient-to-b from-(--color-primary)/50 to-transparent"
                />
              )}
              <span
                aria-hidden
                className={`absolute left-0 top-1 h-5 w-5 rounded-full border-2 ${
                  s.kind === "major"
                    ? "border-(--color-accent) bg-(--color-accent)/20 shadow-[0_0_16px_rgba(251,113,133,0.6)]"
                    : "border-(--color-secondary) bg-(--color-secondary)/20 shadow-[0_0_16px_rgba(94,234,212,0.5)]"
                }`}
              />
              <p className="font-mono text-xs tracking-wide text-(--color-muted-foreground)">
                {s.createdAt}
              </p>
              <p className="font-heading mt-1.5 text-xl leading-snug">
                {s.summary}
              </p>
              <span className="glass mt-2.5 inline-block rounded-full px-3 py-1 text-xs text-(--color-muted-foreground)">
                {kindLabel[s.kind] ?? s.kind}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  );
}
