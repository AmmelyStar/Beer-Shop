// app/components/BrandSection.tsx
import Image from "next/image";

type BrandItem = {
  id: string;
  name: string;
  logo: string; // URL или путь из /public
  url?: string;
};

// ✅ заполняем прямо здесь
const items: BrandItem[] = [
  {
    id: "transistor",
    name: "Transistor",
    logo: "https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-white.svg",
    url: "https://transistor.fm/",
  },
  {
    id: "reform",
    name: "Reform",
    logo: "https://tailwindcss.com/plus-assets/img/logos/158x48/reform-logo-white.svg",
    url: "https://reform.app/",
  },
  {
    id: "tuple",
    name: "Tuple",
    logo: "https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-white.svg",
    url: "https://tuple.app/",
  },
  {
    id: "savvycal",
    name: "SavvyCal",
    logo: "https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-white.svg",
    url: "https://savvycal.com/",
  },
  {
    id: "statamic",
    name: "Statamic",
    logo: "https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-white.svg",
    url: "https://statamic.com/",
  },
];

const text =
  "Нам доверяют команды по всему миру — от стартапов до лидеров рынка.";

export default function BrandSection() {
  if (!items.length) return null;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mx-auto my-10 flex max-w-lg flex-wrap items-center justify-center gap-x-8 gap-y-12 sm:max-w-xl sm:gap-x-10 sm:gap-y-14 lg:max-w-4xl">
          {items.map((partner, idx) => {
            const href = partner.url ?? "#";
            return (
              <a
                key={partner.id}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={
                  href.startsWith("http") ? "noopener noreferrer" : undefined
                }
                aria-label={partner.name}
                className="transition-opacity hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Image
                  alt={partner.name}
                  src={partner.logo}
                  width={158}
                  height={48}
                  className="max-h-12 w-auto object-contain"
                  sizes="(max-width: 640px) 120px, 158px"
                  priority={idx < 2}
                />
              </a>
            );
          })}
        </div>

        <h2 className="mt-16 text-center text-base/7 font-light text-gray-600">
          {text}
        </h2>
      </div>
    </section>
  );
}
