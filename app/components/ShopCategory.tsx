// app/components/ShopCategory.tsx
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/app/lib/locale";
import RowLink from "./ui/RowLink";

type Props = {
  title: string;
  browseAll: string;
  names: {
    beer: string;
    cider: string;
    snacks: string;
    gifts: string;
    nonAlcoholic: string;
  };
  alts: {
    beer: string;
    cider: string;
    snacks: string;
    gifts: string;
    nonAlcoholic: string;
  };
  lang: Locale;
};

export default function ShopCategory({
  title,
  browseAll,
  names,
  alts,
  lang,
}: Props) {
  const cards = [
    {
      key: "beer" as const,
      href: `/${lang}/shop?category=beer`,
      img: "/category/fresh-light-beer-mug.jpg",
      alt: alts.beer,
      big: true,
    },
    {
      key: "cider" as const,
      href: `/${lang}/shop?category=cider`,
      img: "/category/photo_2025-11-02_14-54-50.jpg",
      alt: alts.cider,
    },
    {
      key: "snacks" as const,
      href: `/${lang}/shop?category=snacks`,
      img: "/category/photo_2025-11-02_14-55-04.jpg",
      alt: alts.snacks,
    },
    {
      key: "gifts" as const,
      href: `/${lang}/shop?category=gifts`,
      img: "/category/gifts-and-sets.jpg",
      alt: alts.gifts,
    },
    {
      key: "nonAlcoholic" as const,
      href: `/${lang}/shop?category=nonAlcoholic`,
      img: "/category/non-alcoholic.jpg",
      alt: alts.nonAlcoholic,
    },
  ];

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="sm:flex sm:items-baseline sm:justify-between">
          <h2 className="text-2xl tracking-tight text-white">{title}</h2>
          <RowLink href={`/${lang}/shop`} label={browseAll} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:gap-8">
          {cards.map((c) => (
            <div
              key={c.key}
              className={[
                "group relative overflow-hidden rounded-lg transform transition-all duration-300",
                c.big
                  ? "aspect-2/1 sm:row-span-2 sm:aspect-square"
                  : "aspect-2/1 sm:aspect-auto",
              ].join(" ")}
            >
              <Image
                width={640}
                height={640}
                alt={c.alt}
                src={c.img}
                className="absolute size-full object-cover group-hover:opacity-45 transition-all duration-300"
                priority={c.big}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50"
              />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3
                    className="relative font-extrabold uppercase leading-none
                    text-transparent transition-all duration-300 group-hover:text-yellow-500 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl
                    [-webkit-text-stroke:2px_white]
                    [paint-order:stroke_fill]"
                  >
                    <Link href={c.href}>
                      <span className="absolute inset-0" />
                      {names[c.key]}
                    </Link>
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href={`/${lang}/shop`}
            className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            {browseAll} <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
