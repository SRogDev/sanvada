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
      <div className="pt-6">
        <p className="text-sm uppercase tracking-widest text-(--color-muted-foreground)">
          Crecimiento en el mundo real
        </p>
        <h1 className="font-heading mt-1 text-3xl font-semibold">
          Experiencias
        </h1>
        <p className="mt-2 text-[15px] text-(--color-muted-foreground)">
          Pequeñas invitaciones del mundo real — elegidas para quien estás
          llegando a ser, no rachas que mantener.
        </p>
        <div className="mt-6 grid gap-4">
          {demoExperiences.map((e) => (
            <article
              key={e.id}
              className="rounded-3xl border border-(--color-border) bg-(--color-card) p-5 shadow-sm"
            >
              <span className="rounded-full bg-(--color-muted) px-3 py-1 text-xs font-medium text-(--color-muted-foreground)">
                {statusLabel[e.status] ?? e.status}
              </span>
              <h2 className="font-heading mt-3 text-xl font-semibold">
                {e.title}
              </h2>
              <p className="mt-1 text-[15px] text-(--color-muted-foreground)">
                {e.reason}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-full bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-(--color-border) px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-(--color-muted)"
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
