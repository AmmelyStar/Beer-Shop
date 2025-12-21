"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/app/lib/locale";

type SearchItem = {
  title: string;
  handle?: string | null;
  url?: string | null;
};

type Props = {
  lang: Locale;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function HeaderSearch({ lang }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmed = useMemo(() => q.trim(), [q]);

  // close on outside click
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // close on escape
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // focus input when opened
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // fetch suggestions (debounced)
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function run() {
      if (!open) return;
      if (!trimmed) {
        setItems([]);
        return;
      }

      setLoading(true);

      try {
        // IMPORTANT:
        // Подстрой endpoint под свой проект, если у тебя другой.
        // Я делаю максимально мягко: пробуем /api/search?q=
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&lang=${encodeURIComponent(
            String(lang)
          )}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Search failed");

        const data = (await res.json()) as {
          items?: Array<{ title?: string; handle?: string; url?: string }>;
          results?: Array<{ title?: string; handle?: string; url?: string }>;
        };

        const raw = data.items ?? data.results ?? [];
        const mapped: SearchItem[] = raw
          .map((x) => ({
            title: x.title ?? "",
            handle: x.handle ?? null,
            url: x.url ?? null,
          }))
          .filter((x) => x.title);

        if (!alive) return;
        setItems(mapped.slice(0, 6));
      } catch {
        if (!alive) return;
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    const t = window.setTimeout(run, 180);
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(t);
    };
  }, [open, trimmed, lang]);

  function onSubmit() {
    const query = trimmed;
    if (!query) return;

    // безопасный вариант: ведём на shop с query
    router.push(`/${lang}/shop?query=${encodeURIComponent(query)}`);
    setOpen(false);
  }

  return (
    // ВАЖНО: relative + w-full => dropdown НЕ вылезет за рамку меню
    <div ref={rootRef} className="relative w-full">
      {/* Trigger button (иконка) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center justify-center rounded-xl p-2 transition-colors",
          "text-white/80 hover:text-white hover:bg-white/10"
        )}
        aria-label="Search"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16.2 16.2 21 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          className={cn(
            // РОВНО по ширине контейнера: не вылезает
            "absolute left-0 right-0 top-full mt-2",
            // На мобилке делаем компактнее: максимум 340px, но не шире родителя
            "mx-auto max-w-[340px] md:mx-0 md:max-w-[360px]",
            "rounded-2xl border border-white/10 bg-[#0b0f10] shadow-xl",
            "overflow-hidden"
          )}
          style={{
            // на всякий случай выключаем blur если где-то глобально включен
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
        >
          {/* Input row */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-white/45">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.2 16.2 21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
              placeholder="Search beer…"
              className={cn(
                "w-full bg-transparent outline-none",
                "text-sm text-white placeholder:text-white/35"
              )}
            />

            <button
              type="button"
              onClick={() => {
                setQ("");
                setItems([]);
                inputRef.current?.focus();
              }}
              className="rounded-lg p-1.5 text-white/55 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear"
              title="Clear"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="h-px bg-white/10" />

          {/* Results */}
          <div className="max-h-64 overflow-auto py-1">
            {loading && (
              <div className="px-3 py-2 text-sm text-white/55">Searching…</div>
            )}

            {!loading && trimmed && items.length === 0 && (
              <div className="px-3 py-2 text-sm text-white/55">No results</div>
            )}

            {!loading && !trimmed && (
              <div className="px-3 py-2 text-sm text-white/45">
                Start typing to search
              </div>
            )}

            {!loading &&
              items.map((it, idx) => {
                const href =
                  it.url ??
                  (it.handle
                    ? `/${lang}/product/${it.handle}`
                    : `/${lang}/shop?query=${encodeURIComponent(it.title)}`);

                return (
                  <Link
                    key={`${it.title}-${idx}`}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block px-3 py-2 text-sm",
                      "text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                    )}
                  >
                    {it.title}
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
