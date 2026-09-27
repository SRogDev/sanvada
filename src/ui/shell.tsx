"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 21h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

const tabs = [
  { href: "/chat", label: "Chat", Icon: ChatIcon },
  { href: "/self-map", label: "Mapa", Icon: MapIcon },
  { href: "/experiences", label: "Experiencias", Icon: SparkIcon },
  { href: "/evolution", label: "Evolución", Icon: TrendIcon },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <div className="aurora" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#070b14]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5">
          <div
            aria-hidden
            className="breathe orb-glow h-9 w-9 rounded-full bg-gradient-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent)"
          />
          <span className="font-heading text-glow text-xl font-semibold tracking-wide">
            Sanvada
          </span>
          <span className="glass ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-(--color-muted-foreground)">
            demo
          </span>
        </div>
        {/* Top tabs: desktop only. Mobile uses the bottom bar. */}
        <nav
          className="mx-auto hidden max-w-3xl gap-1 px-5 pb-2.5 md:flex"
          aria-label="Principal"
        >
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-white/[0.1] text-white shadow-[0_0_20px_rgba(139,124,246,0.25)]"
                    : "text-(--color-muted-foreground) hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-36 md:pb-28">{children}</main>

      {/* Floating glass tab bar: mobile only. */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-4 bottom-4 z-20 md:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="glass mx-auto grid max-w-md grid-cols-4 rounded-full px-2 py-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-full py-1.5 transition-all duration-200 ${
                  active
                    ? "text-(--color-secondary) [filter:drop-shadow(0_0_8px_rgba(94,234,212,0.6))]"
                    : "text-(--color-muted-foreground)"
                }`}
              >
                <t.Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
