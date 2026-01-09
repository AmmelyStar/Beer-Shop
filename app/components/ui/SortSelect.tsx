"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SortKey =
  | "best"
  | "new"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc";

const SORT_KEYS: readonly SortKey[] = [
  "best",
  "new",
  "price_asc",
  "price_desc",
  "title_asc",
  "title_desc",
] as const;

function isSortKey(x: unknown): x is SortKey {
  return typeof x === "string" && (SORT_KEYS as readonly string[]).includes(x);
}

export type SortLabels = {
  label: string;
  best: string;
  new: string;
  priceAsc: string;
  priceDesc: string;
  titleAsc: string;
  titleDesc: string;
};

type Option = {
  value: SortKey;
  label: string;
};

export function SortSelect({ labels }: { labels: SortLabels }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRaw = searchParams.get("sort");
  const current: SortKey = currentRaw && isSortKey(currentRaw) ? currentRaw : "best";

  const options: Option[] = [
    { value: "best", label: labels.best },
    { value: "new", label: labels.new },
    { value: "price_asc", label: labels.priceAsc },
    { value: "price_desc", label: labels.priceDesc },
    { value: "title_asc", label: labels.titleAsc },
    { value: "title_desc", label: labels.titleDesc },
  ];

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextValue = e.target.value;
    const nextSort: SortKey = isSortKey(nextValue) ? nextValue : "best";

    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === "best") {
      // чтобы URL был чище (опционально)
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">{labels.label}</span>

      <select
        aria-label={labels.label}
        value={current}
        onChange={onChange}
        className="h-10 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white outline-none hover:bg-white/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-neutral-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
