import Image from "next/image";
type HeroProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref?: string;
  imageUrl?: string; // можешь заменить данными с бэка
};

export default function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/en/shop",
  imageUrl = "/category/golden-beer-bubbles-drop-wet-glass-generated-by-ai.jpg",
}: HeroProps) {
  return (
    <section className="relative overflow-hidden max-w-7xl mx-auto rounded-3xl mt-6 ">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          width={640}
          height={480}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-36">
        <div className="max-w-xl">
          <h1 className="text-6xl font-semibold leading-tight text-white  ">
            {title}
          </h1>
          <p className="mt-4 text-xl text-white/90">{subtitle}</p>
          <a
            href={ctaHref}
            className="mt-8 inline-block rounded-2xl bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
