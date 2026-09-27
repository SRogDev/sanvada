import Link from "next/link";
import { Shell } from "@/ui/shell";

export default function Home() {
  return (
    <Shell>
      <div className="pt-14 text-center md:pt-20">
        <div className="relative mx-auto h-32 w-32">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent) opacity-25 blur-2xl"
          />
          <div
            aria-hidden
            className="breathe orb-glow relative h-32 w-32 rounded-full bg-gradient-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent)"
          />
        </div>
        <h1 className="font-heading text-glow mt-8 text-6xl font-semibold tracking-tight md:text-7xl">
          Sanvada
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-(--color-muted-foreground)">
          Una compañera que te conoce — y te ayuda a convertirte en quien estás
          llegando a ser.
        </p>
        <Link
          href="/chat"
          className="mt-10 inline-block cursor-pointer rounded-full bg-gradient-to-r from-(--color-primary) to-[#6d5ef0] px-10 py-4 text-base font-semibold text-white shadow-[0_0_36px_rgba(139,124,246,0.4)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_52px_rgba(139,124,246,0.55)]"
        >
          Empezar a hablar
        </Link>
        <p className="mt-8 font-heading text-sm italic text-(--color-muted-foreground)">
          “Esta IA me está conociendo poco a poco.”
        </p>
      </div>
    </Shell>
  );
}
