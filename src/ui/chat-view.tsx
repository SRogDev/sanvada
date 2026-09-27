"use client";

import { useRef, useState } from "react";
import type { SentientUIEvent } from "@/application/companion/ports";
import { describeEvent } from "@/ui/sentient/events";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Sanvada. Estoy aquí para conocerte — despacio, con honestidad. ¿Qué tienes en mente hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [cards, setCards] = useState<{ title: string; body: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const eventLine = part
            .split("\n")
            .find((l) => l.startsWith("event: "));
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          const event = eventLine?.slice("event: ".length);
          const data = dataLine?.slice("data: ".length) ?? "";
          if (event === "ui") {
            const uiEvents = JSON.parse(data) as SentientUIEvent[];
            const newCards = uiEvents
              .map(describeEvent)
              .filter((c): c is NonNullable<typeof c> => c !== null)
              .map((c) => ({ title: c.title, body: c.body }));
            setCards((prev) => [...prev, ...newCards]);
          } else if (event === "chunk") {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last)
                copy[copy.length - 1] = {
                  ...last,
                  content: last.content + data,
                };
              return copy;
            });
          }
        }
      }
    }
    setStreaming(false);
    inputRef.current?.focus();
  }

  return (
    <div className="pt-6">
      {cards.length > 0 && (
        <div className="mb-6 grid gap-3" aria-live="polite">
          {cards.map((c, i) => (
            <div
              key={i}
              className="glass rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-secondary)">
                {c.title}
              </p>
              <p className="font-heading mt-1.5 text-lg leading-snug">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 pb-44 md:pb-24" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-3xl px-5 py-3.5 ${
              m.role === "user"
                ? "justify-self-end bg-gradient-to-br from-(--color-primary) to-[#6d5ef0] text-white shadow-[0_4px_24px_rgba(139,124,246,0.35)]"
                : "glass justify-self-start text-(--color-foreground)"
            }`}
          >
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {m.content}
              {streaming &&
                i === messages.length - 1 &&
                m.role === "assistant" && (
                  <span className="breathe ml-1 inline-block h-2 w-2 rounded-full bg-(--color-accent)" />
                )}
            </p>
          </div>
        ))}
      </div>

      {/* Input floats above the mobile bottom tab bar. */}
      <div className="fixed inset-x-0 bottom-[5.75rem] z-10 md:bottom-0">
        <div className="mx-auto max-w-3xl px-5 pb-3 md:pb-0">
          <div className="glass flex gap-2 rounded-full p-2 pl-5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] transition-shadow duration-300 focus-within:shadow-[0_0_32px_rgba(139,124,246,0.3)]">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Cuéntame algo verdadero…"
              aria-label="Mensaje para Sanvada"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-(--color-foreground) outline-none placeholder:text-(--color-muted-foreground)"
            />
            <button
              type="button"
              onClick={send}
              disabled={streaming || !input.trim()}
              aria-label="Enviar mensaje"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-(--color-primary) to-[#6d5ef0] text-white shadow-[0_0_20px_rgba(139,124,246,0.45)] transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
