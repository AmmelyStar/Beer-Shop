// app/components/BrandSection.tsx
import Image from "next/image";
import { getBrandsFromShopify, type BrandItem } from "@/app/lib/shopify/getBrands";

const fallbackItems: BrandItem[] = [
  {
    id: "fallback-test",
    name: "FALLBACK",
    logo: "https://dummyimage.com/240x80/ffffff/000000.png&text=FALLBACK",
    url: "#",
  },
];

// ✅ messages как у тебя в JSON: brandSection.text
type BrandSectionMessages = {
  brandSection?: {
    text?: string;
  };
};

function LogoItem({ partner, idx }: { partner: BrandItem; idx: number }) {
  const href = partner.url ?? "#";
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={partner.name}
      className="flex h-20 items-center justify-center opacity-90 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <Image
        alt={partner.name}
        src={partner.logo}
        width={520}
        height={180}
        // ✅ больше, чем h-40 — используем arbitrary value
        className="h-[168px] w-auto object-contain"
        // ✅ просим браузер брать крупнее на больших экранах
        sizes="(max-width: 640px) 220px, (max-width: 1024px) 320px, 420px"
        priority={idx < 12}
      />
    </a>
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

  if (!items.length) items = fallbackItems;
  if (!items.length) return null;

  const normalized = items
    .filter((x) => x?.logo && x?.name)
    .map((x, i) => ({
      ...x,
      id: x.id || `${x.name}-${i}`,
      url: x.url || "#",
    }))
    .slice(0, maxItems);

  const text = messages?.brandSection?.text ?? "";

  return (
    <section className="bg-[var(--background)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* ✅ твой стиль + грид рядами, не зависит от количества */}
        <div className="grid grid-cols-2 place-items-center gap-x-14 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {normalized.map((partner, idx) => (
            <LogoItem key={`${partner.id}-${idx}`} partner={partner} idx={idx} />
          ))}
        </div>

        {/* ✅ текст снизу на твоём фоне */}
        {text && (
          <p className="mt-16 text-center text-sm font-light text-gray-500">
            {text}
          </p>
        )}
      </div>
    </section>
  );
}
