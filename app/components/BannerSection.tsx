// app/components/BannerSection.tsx

import Image from "next/image";
import Link from "next/link";

type BannerSectionProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  priority?: boolean;
};

export default function BannerSection({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  priority = false,
}: BannerSectionProps) {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      aria-labelledby="banner-heading"
    >
      <div className="relative h-[500px] overflow-hidden rounded-2xl sm:h-[420px] lg:h-96">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 1216px, (min-width: 1024px) 90vw, 100vw"
          className="object-cover object-center"
          priority={priority}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent lg:bg-linear-to-r"
        />

        <div className="absolute inset-0 flex items-end lg:items-stretch">
          <div className="flex w-full flex-col justify-between bg-black/65 p-6 backdrop-blur-sm sm:p-8 lg:w-96 lg:p-10">
            <div>
              <h2
                id="banner-heading"
                className="text-2xl font-semibold tracking-tight text-white"
              >
                {title}
              </h2>

              <p className="mt-4 text-base leading-6 text-gray-400">
                {subtitle}
              </p>
            </div>

            <Link
              href={ctaHref}
              className="
                mt-8 inline-flex w-full items-center justify-center
                rounded-sm border-2 border-white
                bg-stone-950/40 px-6 py-3
                text-sm font-medium uppercase text-white
                transition-colors duration-300
                hover:bg-white hover:text-gray-900
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-white/80
              "
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}