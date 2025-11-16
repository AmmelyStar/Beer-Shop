"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Lang = "en" | "uk" | "ru" | "et" | "fi";
type CategoryKey = "all" | "beer" | "cider" | "snacks";

const CATEGORY_KEYS: CategoryKey[] = ["all", "beer", "cider", "snacks"];

const PRODUCT_TYPE_TO_CATEGORY: Record<string, CategoryKey> = {
  beer: "beer",
  Beer: "beer",
  BEER: "beer",
  cider: "cider",
  Cider: "cider",
  CIDER: "cider",
  snacks: "snacks",
  Snacks: "snacks",
  SNACKS: "snacks",
};

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

export default function Breadcrumbs({
  lang,
  labels,
  currentLabel,
  productCategory,
  separator = "›",
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items: { href: string; label: string }[] = [
    { href: `/${lang}`, label: labels.home },
  ];

  const parts = pathname.split("/").filter(Boolean);
  const afterLang = parts.slice(1);

  // Если мы на странице магазина
  if (afterLang[0] === "shop") {
    items.push({ href: `/${lang}/shop`, label: labels.shop });

    const raw = (searchParams.get("category") ?? "all") as string;
    const category = CATEGORY_KEYS.includes(raw as CategoryKey)
      ? (raw as CategoryKey)
      : "all";

    if (category !== "all") {
      items.push({
        href: `/${lang}/shop?category=${category}`,
        label: labels.categories[category],
      });
    }
  }

  // Если мы на странице товара
  if (afterLang[0] === "product") {
    items.push({ href: `/${lang}/shop`, label: labels.shop });

    if (productCategory) {
      const category =
        PRODUCT_TYPE_TO_CATEGORY[productCategory] ||
        (CATEGORY_KEYS.includes(productCategory.toLowerCase() as CategoryKey)
          ? (productCategory.toLowerCase() as CategoryKey)
          : null);

      if (category && category !== "all") {
        items.push({
          href: `/${lang}/shop?category=${category}`,
          label: labels.categories[category],
        });
      }
    }
  }

  if (currentLabel) {
    items.push({ href: "#", label: currentLabel });
  }

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
                <span className="text-sm font-medium text-gray-300">
                  {it.label}
                </span>
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
