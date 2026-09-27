import { demoExperiences } from "@/ui/demo";
import { Shell } from "@/ui/shell";

const statusLabel: Record<string, string> = {
  proposed: "propuesta",
  accepted: "aceptada",
  rejected: "rechazada",
  expired: "vencida",
  completed: "completada",
};

export default function ExperiencesPage() {
  return (
    <Shell>
      <div className="pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--color-secondary)">
          Crecimiento en el mundo real
        </p>
        <h1 className="font-heading text-glow mt-2 text-4xl font-semibold tracking-tight">
          Experiencias
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-(--color-muted-foreground)">
          Pequeñas invitaciones del mundo real — elegidas para quien estás
          llegando a ser, no rachas que mantener.
        </p>

        <div className="mt-8 grid gap-5">
          {demoExperiences.map((e) => (
            <article
              key={e.id}
              className="glass group rounded-[1.75rem] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-white/[0.07] hover:shadow-[0_16px_60px_rgba(139,124,246,0.15)]"
            >
              <span className="inline-block rounded-full bg-(--color-primary)/15 px-3.5 py-1 text-xs font-medium tracking-wide text-(--color-primary)">
                {statusLabel[e.status] ?? e.status}
              </span>
              <h2 className="font-heading mt-4 text-2xl font-semibold leading-snug">
                {e.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-(--color-muted-foreground)">
                {e.reason}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="cursor-pointer rounded-full bg-gradient-to-r from-(--color-primary) to-[#6d5ef0] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,124,246,0.35)] transition-all duration-200 hover:scale-[1.04]"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-(--color-muted-foreground) transition-colors duration-200 hover:border-white/30 hover:text-white"
                >
                  Ahora no
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}
