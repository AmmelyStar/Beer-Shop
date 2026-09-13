// app/components/ShopCategory.tsx

import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/app/lib/locale";
import RowLink from "./ui/RowLink";

type CategoryKey =
  | "beerInBottles"
  | "cider"
  | "snacks";

type Props = {
  title: string;
  browseAll: string;
  names: Record<CategoryKey, string>;
  alts: Record<CategoryKey, string>;
  lang: Locale;
};

type CategoryCard = {
  key: CategoryKey;
  href: string;
  img: string;
  alt: string;
  big?: boolean;
};

export default function ShopCategory({
  title,
  browseAll,
  names,
  alts,
  lang,
}: Props) {
  const cards: CategoryCard[] = [
    {
      key: "beerInBottles",
      href: `/${lang}/shop?category=bottle-beer`,
      img: "/category/fresh-light-beer-mug.jpg",
      alt: alts.beerInBottles,
      big: true,
    },
    {
      key: "cider",
      href: `/${lang}/shop?category=cider`,
      img: "/category/photo_2025-11-02_14-54-50.jpg",
      alt: alts.cider,
    },
    {
      key: "snacks",
      href: `/${lang}/shop?category=snacks`,
      img: "/category/photo_2025-11-02_14-55-04.jpg",
      alt: alts.snacks,
    },
  ];

  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="sm:flex sm:items-baseline sm:justify-between">
          <h2 className="text-2xl tracking-tight text-white">
            {title}
          </h2>

          <RowLink
            href={`/${lang}/shop`}
            label={browseAll}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:gap-8">
          {cards.map((card) => (
            <div
              key={card.key}
              className={[
                "group relative overflow-hidden rounded-lg transform transition-all duration-300",
                card.big
                  ? "aspect-2/1 sm:row-span-2 sm:aspect-square"
                  : "aspect-2/1 sm:aspect-auto",
              ].join(" ")}
            >
              <Image
                src={card.img}
                alt={card.alt}
                width={640}
                height={640}
                className="absolute size-full object-cover transition-all duration-300 group-hover:opacity-45"
                priority={card.big}
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50"
              />

              <div className="absolute inset-0 flex items-end p-6">
                <h3
                  className="relative text-5xl font-extrabold uppercase leading-none text-transparent transition-all duration-300 group-hover:text-yellow-500 sm:text-6xl lg:text-7xl xl:text-8xl [-webkit-text-stroke:2px_white] [paint-order:stroke_fill]"
                >
                  <Link href={card.href}>
                    <span className="absolute inset-0" />
                    {names[card.key]}
                  </Link>
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href={`/${lang}/shop`}
            className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            {browseAll}{" "}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}