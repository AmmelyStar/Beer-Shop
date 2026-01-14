"use client";

import { useSearchParams } from "next/navigation";
import ShopContent, { type ShopContentProps } from "@/app/components/ShopContent";
import { CATEGORY_KEYS, type CategoryKey } from "@/app/lib/shop/categories";

type Props = Omit<ShopContentProps, "activeCategory">;

function isCategoryKey(x: string): x is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(x);
}

export default function ShopClient(props: Props) {
  const sp = useSearchParams();

  const raw = sp.get("category");
  const activeCategory: CategoryKey = raw && isCategoryKey(raw) ? raw : "all";

  return <ShopContent {...props} activeCategory={activeCategory} />;
}
