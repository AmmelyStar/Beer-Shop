// app/components/BrandSection.tsx

import Image from "next/image";
import {
  getBrandsFromShopify,
  type BrandItem,
} from "@/app/lib/shopify/getBrands";

const fallbackItems: BrandItem[] = [
  {
    id: "fallback-test",
    name: "FALLBACK",
    logo: "https://dummyimage.com/240x80/ffffff/000000.png&text=FALLBACK",
    url: "#",
  },
];

type BrandSectionMessages = {
  brandSection?: {
    text?: string;
  };
};

function LogoItem({
  partner,
  idx,
}: {
  partner: BrandItem;
  idx: number;
}) {
  return (
    <div className="flex h-20 items-center justify-center opacity-90">
      <Image
        alt={partner.name}
        src={partner.logo}
        width={520}
        height={180}
        className="h-[168px] w-auto object-contain"
        sizes="(max-width: 640px) 220px, (max-width: 1024px) 320px, 420px"
        priority={idx < 12}
      />
    </div>
  );
}

export default async function BrandSection({
  messages,
  maxItems = 200,
}: {
  messages?: BrandSectionMessages;
  maxItems?: number;
}) {
  let items: BrandItem[] = [];

  try {
    items = await getBrandsFromShopify();
  } catch {
    items = [];
  }

  if (!items.length) {
    items = fallbackItems;
  }

  const normalized = items
    .filter((item) => item?.logo && item?.name)
    .map((item, index) => ({
      ...item,
      id: item.id || `${item.name}-${index}`,
    }))
    .slice(0, maxItems);

  if (!normalized.length) {
    return null;
  }

  const text = messages?.brandSection?.text ?? "";

  return (
    <section className="bg-[var(--background)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 place-items-center gap-x-14 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {normalized.map((partner, idx) => (
            <LogoItem
              key={`${partner.id}-${idx}`}
              partner={partner}
              idx={idx}
            />
          ))}
        </div>

        {text && (
          <p className="mt-16 text-center text-sm font-light text-gray-500">
            {text}
          </p>
        )}
      </div>
    </section>
  );
}