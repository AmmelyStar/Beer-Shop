"use client";

import type { FlattenedProduct } from "@/app/data/mappers";
import type { Locale } from "@/app/[lang]/messages";
import AllProducts from "@/app/components/AllProducts";
import type { ReviewSummary } from "@/app/lib/reviews/getReviewSummaryByHandle";

import TabsQuery from "@/app/components/ui/TabsQuery";
import { SortSelect } from "@/app/components/ui/SortSelect";

import { CATEGORY_KEYS, type CategoryKey } from "@/app/lib/shop/categories";

type SortLabels = {
  label: string;
  best: string;
  new: string;
  priceAsc: string;
  priceDesc: string;
  titleAsc: string;
  titleDesc: string;
};

type ShopTranslations = {
  title: string; // заголовок для "all"
  stars: string;
  reviews: string;
  add: string;
  alcohol: string;
  noProducts: string;
  noProductsDescription: string;
  categories: Record<CategoryKey, string>;
  sort: SortLabels;
};

export type ShopContentProps = {
  products: FlattenedProduct[];
  translations: ShopTranslations;
  lang: Locale;
  reviewSummaries: Record<string, ReviewSummary>;
  activeCategory: CategoryKey; // приходит с сервера/родителя
};

export default function ShopContent({
  products,
  translations,
  lang,
  reviewSummaries,
  activeCategory,
}: ShopContentProps) {
  const hasProducts = products.length > 0;

  const pageTitle =
    activeCategory === "all"
      ? translations.title
      : translations.categories[activeCategory] ?? translations.title;

  return (
    <section className="mt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsQuery<CategoryKey>
          keys={CATEGORY_KEYS}
          labels={translations.categories}
          paramKey="category"
          // (опционально) guard, чтобы из URL не принимался мусор
          isKey={(x): x is CategoryKey =>
            (CATEGORY_KEYS as readonly string[]).includes(x)
          }
        />

        <SortSelect labels={translations.sort} />
      </div>

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
          title={pageTitle}
          stars={translations.stars}
          reviews={translations.reviews}
          add={translations.add}
          alcohol={translations.alcohol}
          lang={lang}
          products={products}
          reviewSummaries={reviewSummaries}
        />
      )}
    </section>
  );
}
