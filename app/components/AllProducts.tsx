import Image from "next/image";
import { StarIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { WineOff } from "lucide-react";
import type { FlattenedProduct } from "../data/mappers";
import type { Locale } from "@/app/[lang]/messages";

const classNames = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type CategoryKey = "beer" | "cider" | "snacks";

type AllProductsProps = {
  title: string;
  stars: string; // локализация "out of 5 stars"
  reviews: string; // локализация "reviews"
  add: string; // кнопка "Add"
  alcohol: string; // бейдж "безалкогольное"
  rating?: string; // опционально, если понадобится

  lang: Locale;
  products: FlattenedProduct[];
  category?: CategoryKey; // ← активная категория для построения ссылок
};

export default function AllProducts({
  title,
  stars,
  reviews,
  add,
  alcohol,
  lang,
  products,
  category,
}: AllProductsProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:max-w-7xl lg:px-8">
      <h2 className="text-2xl tracking-tight text-white">{title}</h2>

      <div className="mt-8 grid grid-cols-1 gap-y-16 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        {products.map((p) => {
          const img = p.featuredImage;
          const price = p.priceRange?.minVariantPrice;

          // ABV (крепость) и объём
          const abvRaw = p.specs?.abv; // "4.7" | "0" | undefined
          const abvNum =
            abvRaw !== undefined && abvRaw !== "" ? Number(abvRaw) : null;
          const hasAbv = abvNum !== null && !Number.isNaN(abvNum);
          const isAlcoholFree = hasAbv && abvNum === 0;

          let packText: string | null = null;
          if (p.specs?.pack_size_l) packText = `${p.specs.pack_size_l} L`;

          const metaParts: string[] = [];
          if (hasAbv) metaParts.push(`${abvNum} %`);
          if (packText) metaParts.push(packText);
          const meta = metaParts.join(" • ");

          const productRating = p.rating ?? 0;

          // ссылка на товар с сохранением текущей категории
          const href = `/${lang}/product/${p.handle}${
            category ? `?category=${category}` : ""
          }`;

          return (
            <div key={p.id} className="group">
              <div className="relative">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-stone-600 transition-colors duration-300 group-hover:bg-white">
                  {img?.url && (
                    <Image
                      src={img.url}
                      alt={img.altText ?? p.title}
                      fill
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                      className="object-contain p-3 transition-transform duration-300 transform-gpu will-change-transform group-hover:scale-105"
                    />
                  )}

                  {isAlcoholFree && (
                    <span
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-1 text-[10px] font-semibold uppercase text-white shadow-lg ring-1 ring-black/10"
                      aria-label={alcohol}
                    >
                      <WineOff className="h-3.5 w-3.5" aria-hidden="true" />
                      {alcohol}
                      <span className="sr-only">{alcohol}</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-yellow-400">
                      <Link
                        href={href}
                        className="focus:outline-none focus:ring-2 focus:ring-white/30 rounded"
                      >
                        {p.title}
                        <span
                          className="absolute inset-0 rounded-lg"
                          aria-hidden="true"
                        />
                      </Link>
                    </h3>

                    {meta && <p className="text-sm text-gray-300">{meta}</p>}
                  </div>

                  <p className="text-lg font-semibold text-white">
                    {price ? `${price.amount} ${price.currencyCode}` : "—"}
                  </p>
                </div>

                <div className="mt-3 flex flex-col">
                  <span className="sr-only">
                    {productRating} {stars}
                  </span>
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <StarIcon
                        key={i}
                        aria-hidden="true"
                        className={classNames(
                          productRating > i ? "text-white" : "text-gray-500",
                          "size-3 shrink-0"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">0 {reviews}</p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={href}
                  className="relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {add}
                  <span className="sr-only">, {p.title}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
