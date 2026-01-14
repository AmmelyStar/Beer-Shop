"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props<K extends string> = {
  keys: readonly K[];
  labels: Record<K, string>;
  paramKey: string;              // например "category"
  isKey?: (x: string) => x is K; // guard
  resetParams?: string[];        // например ["page"]
};

export default function TabsQuery<K extends string>({
  keys,
  labels,
  paramKey,
  isKey,
  resetParams = ["page"],
}: Props<K>) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const raw = sp.get(paramKey);
  const active: K =
    raw &&
    (isKey ? isKey(raw) : (keys as readonly string[]).includes(raw))
      ? (raw as K)
      : keys[0];

  const setActive = (next: K) => {
    const nextSp = new URLSearchParams(sp.toString());
    nextSp.set(paramKey, next);

    // сбрасываем то, что надо (обычно page)
    for (const k of resetParams) nextSp.delete(k);

    const qs = nextSp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    // ВАЖНО: чтобы сервер реально пересчитал products
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => {
        const isActive = k === active;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setActive(k)}
            aria-pressed={isActive}
            className={[
              "rounded-full border px-3 py-1 text-sm transition",
              isActive
                ? "border-white/70 bg-white/10 text-white"
                : "border-white/15 text-white/80 hover:border-white/40 hover:text-white",
            ].join(" ")}
          >
            {labels[k]}
          </button>
        );
      })}
    </div>
  );
}
