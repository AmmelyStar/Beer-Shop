"use client";

import { useSearchParams } from "next/navigation";

export default function ShopClient({ lang }: { lang: string }) {
  const sp = useSearchParams();

  // пример: category/sort/page
  const category = sp.get("category") ?? "all";
  const sort = sp.get("sort") ?? "popular";
  const page = Number(sp.get("page") ?? "1");

  return (
    <div>
      <h1 className="text-xl font-semibold">Shop ({lang})</h1>
      <div className="text-sm opacity-70">
        category={category} sort={sort} page={page}
      </div>

      {/* дальше твой реальный UI магазина */}
    </div>
  );
}
