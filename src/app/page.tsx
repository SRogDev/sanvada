import Link from "next/link";
import { Shell } from "@/ui/shell";

export default function Home() {
  return (
    <Shell>
      <div className="pt-16 text-center">
        <div
          aria-hidden
          className="breathe mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent)"
        />
        <h1 className="font-heading mt-6 text-5xl font-semibold">Sanvada</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-(--color-muted-foreground)">
          A companion that gets to know you — and helps you become who you're
          growing into.
        </p>
        <Link
          href="/chat"
          className="mt-8 inline-block cursor-pointer rounded-full bg-(--color-foreground) px-8 py-3 font-semibold text-(--color-background) transition-transform duration-200 hover:scale-[1.03]"
        >
          Start talking
        </Link>
        <p className="mt-6 text-sm text-(--color-muted-foreground)">
          “This AI is progressively getting to know me.”
        </p>
      </div>
    </Shell>
  );
}
