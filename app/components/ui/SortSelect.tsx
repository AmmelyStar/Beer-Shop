"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SortLabels = {
  label: string;
  best: string;
  new: string;
  priceAsc: string;
  priceDesc: string;
  titleAsc: string;
  titleDesc: string;
};

type SortUrlKey =
  | "best"
  | "new"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc";

// на случай, если где-то ещё прилетит camelCase
function normalizeSort(raw: string | null): SortUrlKey {
  if (!raw) return "best";

  const mapped =
    raw === "priceAsc" ? "price_asc" :
    raw === "priceDesc" ? "price_desc" :
    raw === "titleAsc" ? "title_asc" :
    raw === "titleDesc" ? "title_desc" :
    raw;

  return (
    mapped === "best" ||
    mapped === "new" ||
    mapped === "price_asc" ||
    mapped === "price_desc" ||
    mapped === "title_asc" ||
    mapped === "title_desc"
  )
    ? (mapped as SortUrlKey)
    : "best";
}

export function SortSelect({ labels }: { labels: SortLabels }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const active = normalizeSort(sp.get("sort"));

  const setSort = (next: SortUrlKey) => {
    const nextSp = new URLSearchParams(sp.toString());

    // "best" можно убрать из URL, чтобы было чище
    if (next === "best") nextSp.delete("sort");
    else nextSp.set("sort", next);

    // обычно при смене сортировки сбрасываем страницу
    nextSp.delete("page");

    const qs = nextSp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    router.refresh();
  };

  // подписи берём из твоих labels (camelCase)
  const labelFor = (k: SortUrlKey) => {
    switch (k) {
      case "best":
        return labels.best;
      case "new":
        return labels.new;
      case "price_asc":
        return labels.priceAsc;
      case "price_desc":
        return labels.priceDesc;
      case "title_asc":
        return labels.titleAsc;
      case "title_desc":
        return labels.titleDesc;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/70">{labels.label}</span>

      <select
        value={active}
        onChange={(e) => setSort(e.target.value as SortUrlKey)}
        className={[
          "min-w-[220px] rounded-md border border-white/15",
          "bg-[#0f0f0f] px-3 py-2 text-sm text-white",
          "outline-none focus:border-white/40",
        ].join(" ")}
      >
        <option value="best">{labelFor("best")}</option>
        <option value="new">{labelFor("new")}</option>
        <option value="price_asc">{labelFor("price_asc")}</option>
        <option value="price_desc">{labelFor("price_desc")}</option>
        <option value="title_asc">{labelFor("title_asc")}</option>
        <option value="title_desc">{labelFor("title_desc")}</option>
      </select>
    </div>
  );
}
