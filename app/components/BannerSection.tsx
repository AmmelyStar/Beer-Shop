import Image from "next/image";
import Link from "next/link";

type BannerSectionProps = {
  imageSrc: string; // например: "/category/beerbottle22.jpg" (лежит в /public)
  imageAlt: string; // осмысленный alt
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
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl"
      aria-labelledby="banner-heading"
    >
      <div className="relative overflow-hidden rounded-lg">
        {/* контейнер под responsive-картинку */}
        <div className="relative  w-full lg:h-96 lg:aspect-auto">
          <Image
            alt={imageAlt}
            src={imageSrc}
            fill
            sizes="(min-width:1024px) 1120px, (min-width:640px) 640px, 100vw"
            className="object-cover"
            priority={priority}
          />
          {/* затемнение + градиент для читабельности текста */}
          {/* <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-black/20" /> */}
        </div>

        {/* карточка с текстом/кнопкой */}
        <div className="absolute inset-x-0 bottom-0 rounded-bl-lg rounded-br-lg bg-black/60 p-6 backdrop-blur-sm sm:flex sm:items-center sm:justify-between lg:inset-x-auto lg:inset-y-0 lg:w-96 lg:flex-col lg:items-start lg:rounded-br-none lg:rounded-tl-lg">
          <div>
            <h2 id="banner-heading" className="text-xl font-bold text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-200">{subtitle}</p>
          </div>

          <Link
            href={ctaHref}
            className="mt-6 inline-flex shrink-0 items-center justify-center rounded-md border border-white/25 px-4 py-3 text-base font-medium text-white hover:bg-white/10 sm:ml-8 sm:mt-0 lg:ml-0 lg:w-full"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
