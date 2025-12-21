"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebouncedValue } from "@/app/lib/useDebouncedValue";

type HeaderSearchMessages = {
  HeaderSearch?: { label?: string; placeholder?: string };
};

type SearchProduct = {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

type SearchApiResponse = {
  products?: SearchProduct[];
  error?: string;
};

export default function HeaderSearch({
  lang,
  messages,
  label,
}: {
  lang: string;
  messages?: HeaderSearchMessages;
  /** кастомная подпись (перебьёт messages) */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const Label = messages?.HeaderSearch?.label ?? label ?? "Search products";
  const Placeholder = messages?.HeaderSearch?.placeholder ?? "Search beer…";

  const close = () => {
    setOpen(false);
    setQuery("");
    setItems([]);
    setError(null);
    setLoading(false);
  };

  // автофокус
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // закрытие при клике вне dropdown
  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Поиск через API route
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!open) return;

      const q = debounced.trim();

      // пока меньше 2 символов — ничего не ищем и не показываем "not found"
      if (q.length < 2) {
        setItems([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });

        const data = (await res.json()) as SearchApiResponse;

        if (!res.ok) {
          throw new Error(data?.error || "Search failed");
        }

        if (!cancelled) setItems(data.products ?? []);
      } catch (e: unknown) {
        if (!cancelled) {
          setItems([]);
          const message = e instanceof Error ? e.message : "Search failed";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const showNoResults =
    open &&
    !loading &&
    !error &&
    debounced.trim().length >= 2 &&
    items.length === 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Лупа */}
      <button
        type="button"
        aria-label={Label}
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-gray-400 hover:text-yellow-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-md"
      >
        <span className="sr-only">{Label}</span>
        <MagnifyingGlassIcon aria-hidden="true" className="h-6 w-6" />
      </button>

      {/* Dropdown (не во всю ширину хедера) */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-zinc-950/95 shadow-2xl ring-1 ring-white/10 backdrop-blur p-4 z-50">
          {/* Input line (как в форме: тонкая линия снизу) */}
          <div className="flex items-center gap-3 border-b border-white/15 pb-2 focus-within:border-white/35">
            <MagnifyingGlassIcon className="h-5 w-5 text-white/60" />

            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
              }}
              placeholder={Placeholder}
              autoComplete="off"
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm text-white placeholder:text-white/40"
            />

            <button
              type="button"
              onClick={close}
              className="text-white/50 hover:text-white/80"
              aria-label="Close search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Состояния */}
          <div className="mt-3">
            {loading && (
              <p className="text-sm text-white/45">Searching…</p>
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            {showNoResults && (
              <p className="text-sm text-white/45">No products found</p>
            )}

            {!loading && !error && items.length > 0 && (
              <ul className="mt-2 space-y-1">
                {items.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.handle}`}
                      className="block rounded-xl px-2 py-2 text-sm text-white/85 hover:bg-white/5"
                      onClick={() => setOpen(false)}
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
