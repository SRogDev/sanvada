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
              className="rounded-2xl border border-(--color-border) bg-(--color-card) p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">
                {c.title}
              </p>
              <p className="font-heading mt-1 text-lg">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 pb-36 md:pb-24" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "justify-self-end bg-(--color-foreground) text-(--color-background)"
                : "justify-self-start border border-(--color-border) bg-(--color-card)"
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

      {/* Input sits above the mobile bottom tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] border-t border-(--color-border) bg-(--color-background)/95 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Cuéntame algo verdadero…"
            aria-label="Mensaje para Sanvada"
            className="min-w-0 flex-1 rounded-full border border-(--color-border) bg-(--color-card) px-4 py-2.5 text-[15px] outline-none focus:border-(--color-secondary)"
          />
          <button
            type="button"
            onClick={send}
            disabled={streaming || !input.trim()}
            className="cursor-pointer rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
