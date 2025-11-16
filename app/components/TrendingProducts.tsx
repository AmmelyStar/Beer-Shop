// app/components/TrendingProducts.tsx
import Image from "next/image";
import { StarIcon } from "@heroicons/react/20/solid";
import { WineOff } from "lucide-react";
import Link from "next/link";
import type { FlattenedProduct } from "@/app/data/mappers";
import type { Locale } from "@/app/lib/locale";

const classNames = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type TrendingProductsProps = {
  products: FlattenedProduct[];
  title: string;
  stars: string;
  reviews: string;
  add: string;
  alcohol: string;
  lang: Locale;
};

export default function TrendingProducts({
  products,
  title,
  stars,
  reviews,
  add,
  alcohol,
  lang,
}: TrendingProductsProps) {
  // если вдруг пока нет ни одного товара с флажком trending — просто ничего не показываем
  if (!products.length) return null;

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-26 sm:px-6 lg:max-w-7xl lg:px-8 ">
        <h2 className="text-2xl tracking-tight text-white">{title}</h2>

        <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8 items-stretch">
          {products.map((product) => {
            const abv = product.specs?.abv
              ? Number(product.specs.abv)
              : undefined;

            const priceObj = product.priceRange?.minVariantPrice;
            const price =
              priceObj != null
                ? `${Number(priceObj.amount).toFixed(2)} ${
                    priceObj.currencyCode
                  }`
                : "";

            const rating = product.rating ?? 0;
            const reviewCount = product.reviewCount ?? 0;

            const href = `/${lang}/product/${product.handle}`;

            return (
              <div key={product.id} className="group flex flex-col h-full">
                {/* верхняя часть карточки (растягивается) */}
                <div className="relative flex-1 flex flex-col">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-stone-700 transition-colors duration-300 group-hover:bg-white">
                    <Image
                      src={
                        product.featuredImage?.url ??
                        "/category/Steam_Beer_700x700px.webp"
                      }
                      alt={product.featuredImage?.altText ?? product.title}
                      fill
                      sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                      className="object-contain transition-transform duration-300 transform-gpu will-change-transform group-hover:scale-105 p-3"
                    />

                    {abv !== undefined && abv === 0 && (
                      <span
                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-1 text-[10px] font-semibold uppercase text-white shadow-lg ring-1 ring-black/10"
                        aria-label="Alcohol-free"
                      >
                        <WineOff className="h-3.5 w-3.5" aria-hidden="true" />
                        {alcohol}
                        <span className="sr-only">{alcohol}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white pr-6">
                        <Link href={href} className="focus:outline-none">
                          {product.title}
                          <span
                            className="absolute inset-0 rounded-lg"
                            aria-hidden="true"
                          />
                        </Link>
                      </h3>
                      {abv !== undefined && <p>{abv} %</p>}
                    </div>
                    {price && (
                      <p className="text-lg font-semibold text-white">
                        {price}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col">
                    <span className="sr-only">
                      {rating} {stars}
                    </span>
                    <div className="flex">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <StarIcon
                          key={i}
                          aria-hidden="true"
                          className={classNames(
                            rating > i ? "text-yellow-400" : "text-gray-500",
                            "size-5 shrink-0"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {reviewCount} {reviews}
                    </p>
                  </div>
                </div>

                {/* кнопка прижата к низу карточки */}
                <div className="mt-6">
                  <Link
                    href={href}
                    className="relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    {add}
                    <span className="sr-only">, {product.title}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
