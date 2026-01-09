"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { CategoryKey } from "@/app/lib/shop/categories";
import { CATEGORY_KEYS } from "@/app/lib/shop/categories";

type Lang = "en" | "uk" | "ru" | "et" | "fi";

export type BreadcrumbLabels = {
  home: string;
  shop: string;
  categories: Record<CategoryKey, string>;
};

interface BreadcrumbsProps {
  lang: Lang;
  labels: BreadcrumbLabels;
  currentLabel?: string;
  productCategory?: string;
  separator?: string;
}

function getCategory(sp: URLSearchParams): CategoryKey {
  const raw = sp.get("category") ?? "all";
  return (CATEGORY_KEYS as readonly string[]).includes(raw) ? (raw as CategoryKey) : "all";
}

function buildShopHref(lang: Lang, sp: URLSearchParams, category: CategoryKey) {
  const next = new URLSearchParams(sp.toString());
  if (category === "all") next.delete("category");
  else next.set("category", category);

  const qs = next.toString();
  return qs ? `/${lang}/shop?${qs}` : `/${lang}/shop`;
}

export default function Breadcrumbs({
  lang,
  labels,
  currentLabel,
  productCategory,
  separator = "›",
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const params = new URLSearchParams(sp.toString());

  const items: { href: string; label: string }[] = [{ href: `/${lang}`, label: labels.home }];

  const parts = pathname.split("/").filter(Boolean);
  const afterLang = parts.slice(1);

  if (afterLang[0] === "shop") {
    items.push({ href: buildShopHref(lang, params, "all"), label: labels.shop });

    const active = getCategory(params);
    if (active !== "all") {
      items.push({
        href: buildShopHref(lang, params, active),
        label: labels.categories[active],
      });
    }
  }

  if (afterLang[0] === "product") {
    items.push({ href: buildShopHref(lang, params, "all"), label: labels.shop });

    // если ты передаёшь productCategory — можешь здесь сделать маппинг,
    // но это уже вторично. Оставим просто текущий label ниже.
  }

  if (currentLabel) items.push({ href: "#", label: currentLabel });

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl pb-10">
      <ol role="list" className="flex items-center space-x-2">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${it.href}-${i}`} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="mx-2 text-gray-400">
                  {separator}
                </span>
              )}
              {last ? (
                <span className="text-sm font-medium text-gray-300">{it.label}</span>
              ) : (
                <Link
                  href={it.href}
                  className="text-sm font-medium text-gray-400 hover:text-white"
                >
                  {it.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
