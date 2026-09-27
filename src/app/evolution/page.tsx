import { demoSnapshots } from "@/ui/demo";
import { Shell } from "@/ui/shell";

const kindLabel: Record<string, string> = {
  minor: "cambio menor",
  major: "cambio mayor",
};

export default function EvolutionPage() {
  return (
    <Shell>
      <div className="pt-6">
        <p className="text-sm uppercase tracking-widest text-(--color-muted-foreground)">
          Cómo cambió tu contexto
        </p>
        <h1 className="font-heading mt-1 text-3xl font-semibold">Evolución</h1>
        <p className="mt-2 text-[15px] text-(--color-muted-foreground)">
          Instantáneas de cómo te he entendido con el tiempo. Nada se
          sobrescribe — cada versión permanece.
        </p>
        <ol className="mt-6 grid gap-0">
          {demoSnapshots.map((s, i) => (
            <li key={s.id} className="relative pl-8 pb-8 last:pb-0">
              {i < demoSnapshots.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[7px] top-6 bottom-0 w-px bg-(--color-border)"
                />
              )}
              <span
                aria-hidden
                className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 ${
                  s.kind === "major"
                    ? "border-(--color-primary) bg-(--color-primary)/20"
                    : "border-(--color-secondary) bg-(--color-secondary)/20"
                }`}
              />
              <p className="text-xs text-(--color-muted-foreground)">
                {s.createdAt}
              </p>
              <p className="font-heading mt-0.5 text-lg">{s.summary}</p>
              <span className="mt-1 inline-block rounded-full bg-(--color-muted) px-2 py-0.5 text-xs text-(--color-muted-foreground)">
                {kindLabel[s.kind] ?? s.kind}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  );
}
