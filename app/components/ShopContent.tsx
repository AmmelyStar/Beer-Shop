// app/components/ShopContent.tsx
"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Tabs from "./ui/Tabs";
import AllProducts, { LeafCategory } from "./AllProducts";
import type { FlattenedProduct } from "@/app/data/mappers";
import type { Locale } from "@/app/[lang]/messages";

type CategoryKey = "all" | LeafCategory;

interface ShopContentProps {
  products: FlattenedProduct[];
  translations: {
    title: string;
    stars: string;
    reviews: string;
    add: string;
    alcohol: string;
    noProducts: string;
    noProductsDescription: string;
    categories: Record<CategoryKey, string>;
  };
  lang: Locale;
}

const CATEGORIES: CategoryKey[] = [
  "all",
  "beer",
  "cider",
  "snacks",
  "gifts-sets",
  "alcohol-free",
];

export default function ShopContent({
  products,
  translations,
  lang,
}: ShopContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = (searchParams.get("category") ?? "all") as string;
  const initialTab: CategoryKey = CATEGORIES.includes(tabFromUrl as CategoryKey)
    ? (tabFromUrl as CategoryKey)
    : "all";

  const [activeTab, setActiveTab] = useState<CategoryKey>(initialTab);

  const handleTabChange = (tab: CategoryKey) => {
    setActiveTab(tab);

    const params = new URLSearchParams(searchParams.toString());

    if (tab === "all") {
      params.delete("category");
    } else {
      params.set("category", tab);
    }

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    return products.filter((p) => p.collections?.includes(activeTab));
  }, [products, activeTab]);

  const categoryTitle =
    translations.categories[activeTab] ?? translations.categories.all;

  const currentCategory: LeafCategory | undefined =
    activeTab !== "all" ? activeTab : undefined;

  return (
    <>
      <Tabs<CategoryKey>
        activeTab={activeTab}
        onTabChange={handleTabChange}
        labels={translations.categories}
        keys={CATEGORIES}
      />

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">🍺</div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {translations.noProducts}
          </h3>
          <p className="text-gray-400 text-center max-w-md">
            {translations.noProductsDescription}
          </p>
        </div>
      ) : (
        <AllProducts
          title={categoryTitle}
          stars={translations.stars}
          reviews={translations.reviews}
          add={translations.add}
          alcohol={translations.alcohol}
          lang={lang}
          products={filteredProducts}
          category={currentCategory}
        />
      )}
    </>
  );
}
