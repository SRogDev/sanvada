"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/chat", label: "Chat" },
  { href: "/self-map", label: "Self Map" },
  { href: "/experiences", label: "Experiences" },
  { href: "/evolution", label: "Evolution" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-background)/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div
            aria-hidden
            className="breathe h-8 w-8 rounded-full bg-gradient-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent)"
          />
          <span className="font-heading text-xl font-semibold">Sanvada</span>
          <span className="ml-auto rounded-full bg-(--color-muted) px-2 py-0.5 text-xs text-(--color-muted-foreground)">
            demo
          </span>
        </div>
        <nav
          className="mx-auto flex max-w-3xl gap-1 px-4 pb-2"
          aria-label="Primary"
        >
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors duration-200 ${
                  active
                    ? "bg-(--color-foreground) text-(--color-background)"
                    : "text-(--color-muted-foreground) hover:bg-(--color-muted)"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24">{children}</main>
    </div>
  );
}
