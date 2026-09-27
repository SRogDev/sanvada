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
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
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
        {/* Top tabs: desktop only. Mobile uses the bottom bar. */}
        <nav
          className="mx-auto hidden max-w-3xl gap-1 px-4 pb-2 md:flex"
          aria-label="Principal"
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

      <main className="mx-auto max-w-3xl px-4 pb-32 md:pb-24">{children}</main>

      {/* Bottom tab bar: mobile only. */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-(--color-border) bg-(--color-background)/95 backdrop-blur md:hidden"
      >
        <div
          className="mx-auto grid max-w-3xl grid-cols-4 px-2 pt-1"
          style={{
            paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom))",
          }}
        >
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors duration-200 ${
                  active
                    ? "text-(--color-accent)"
                    : "text-(--color-muted-foreground)"
                }`}
              >
                <t.Icon className="h-6 w-6" />
                <span className="text-[11px] font-medium">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
