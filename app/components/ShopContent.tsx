"use client";

import { useMemo, useState } from "react";
import type { FlattenedProduct } from "@/app/data/mappers";
import type { Locale } from "@/app/[lang]/messages";
import AllProducts from "@/app/components/AllProducts";
import type { ReviewSummary } from "@/app/lib/reviews/getReviewSummaryByHandle";

type CategoryKey = "beer" | "cider" | "snacks" | "gifts-sets" | "alcohol-free";

type ShopTranslations = {
  title: string;
  stars: string;
  reviews: string;
  add: string;
  alcohol: string;
  noProducts: string;
  noProductsDescription: string;
  categories: Record<CategoryKey, string>;
};

export type ShopContentProps = {
  products: FlattenedProduct[];
  translations: ShopTranslations;
  lang: Locale;

  // ✅ NEW
  reviewSummaries: Record<string, ReviewSummary>;
};

export default function ShopContent({
  products,
  translations,
  lang,
  reviewSummaries,
}: ShopContentProps) {
  // Если у тебя есть фильтры по категориям — они могут быть тут.
  // Я оставляю минимально безопасно: если фильтров нет — просто рендерим все.
  const [activeCategory, setActiveCategory] = useState<CategoryKey | undefined>(
    undefined
  );

  const filtered = useMemo(() => {
    // Если у тебя реально есть логика фильтрации по category — вставь сюда.
    // Сейчас: если category не выбрана — показываем все.
    if (!activeCategory) return products;

    // Пытаемся отфильтровать по коллекциям/тегам если они есть
    return products.filter((p) => {
      const collections = (p.collections ?? []).map((c) => c.toLowerCase());

      if (activeCategory === "beer")
        return collections.some((c) => c.includes("beer") || c.includes("пиво"));

      if (activeCategory === "cider")
        return collections.some((c) => c.includes("cider") || c.includes("сидр"));

      if (activeCategory === "snacks")
        return collections.some((c) => c.includes("snack") || c.includes("снек"));

      if (activeCategory === "gifts-sets")
        return collections.some(
          (c) => c.includes("gift") || c.includes("set") || c.includes("набор")
        );

      if (activeCategory === "alcohol-free")
        return (
          String(p.specs?.abv ?? "").trim() === "0" ||
          String(p.specs?.abv ?? "").trim() === "0.0"
        );

      return true;
    });
  }, [products, activeCategory]);

  const hasProducts = filtered.length > 0;

  return (
    <section className="mt-6">
      {/* Если у тебя есть UI категорий — вот место.
          Сейчас оставляю минимально: можно включить позже. */}
      {/* <div className="flex flex-wrap gap-2">
        {(
          Object.keys(translations.categories) as CategoryKey[]
        ).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            {translations.categories[key]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveCategory(undefined)}
          className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
        >
          All
        </button>
      </div> */}

      {!hasProducts ? (
        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            {translations.noProducts}
          </h3>
          <p className="mt-2 text-sm text-gray-300">
            {translations.noProductsDescription}
          </p>
        </div>
      ) : (
        <AllProducts
          title={translations.title}
          stars={translations.stars}
          reviews={translations.reviews}
          add={translations.add}
          alcohol={translations.alcohol}
          lang={lang}
          products={filtered}
          category={activeCategory}
          reviewSummaries={reviewSummaries} // ✅ ключевое
        />
      )}
    </section>
  );
}
