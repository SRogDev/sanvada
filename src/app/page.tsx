import Link from "next/link";

const routes = [
  { href: "/chat", label: "Chat", note: "the center of the product" },
  { href: "/self-map", label: "Self Map", note: "“Así te veo”" },
  { href: "/experiences", label: "Experiences", note: "real-world growth" },
  { href: "/evolution", label: "Evolution", note: "how your context changed" },
  { href: "/settings", label: "Settings", note: "you own your representation" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-slate-500">
        Phase 0 — scaffold
      </p>
      <h1 className="mt-2 text-4xl font-bold">Sanvada</h1>
      <p className="mt-4 text-lg text-slate-600">
        A conversational AI that progressively builds a longitudinal,
        contextualized representation of you — <em>Human Context</em> — and uses
        it to personalize conversations, development decisions, and real-world
        experiences.
      </p>
      <p className="mt-2 text-slate-600">
        You should feel: “This AI is progressively getting to know me.”
      </p>
      <nav className="mt-10 grid gap-3">
        {routes.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400"
          >
            <span className="font-medium">{r.label}</span>
            <span className="ml-2 text-sm text-slate-500">{r.note}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
