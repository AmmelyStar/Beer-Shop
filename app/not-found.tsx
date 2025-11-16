// app/not-found.tsx
"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export const DICT = {
  en: {
    text: "Page not found",
    actions: { home: "Go to homepage", back: "Go back" },
  },
  ru: {
    text: "Страница не найдена",
    actions: { home: "На главную", back: "Назад" },
  },
  uk: {
    text: "Сторінку не знайдено",
    actions: { home: "На головну", back: "Назад" },
  },
  et: {
    text: "Lehekülge ei leitud",
    actions: { home: "Avalehele", back: "Tagasi" },
  },
  fi: {
    text: "Sivua ei löytynyt",
    actions: { home: "Etusivulle", back: "Takaisin" },
  },
} as const;

type Lang = keyof typeof DICT;
const LOCALES = new Set(Object.keys(DICT));

export default function NotFound() {
  const pathname = usePathname() || "/";
  const [, first] = pathname.split("/");
  const lang: Lang = LOCALES.has(first) ? (first as Lang) : "en";
  const t = DICT[lang];

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-40 sm:px-6 lg:px-8 flex items-center justify-center flex-col">
        <Image
          src="/category/404.png"
          alt="404 illustration"
          width={320}
          height={320}
          priority
        />
        <p className="text-xl ">{t.text}</p>

        <div className="flex gap-3 justify-center flex-col pt-12 pl-2">
          <Link
            href={`/${lang}`}
            className="relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 w-80"
          >
            {t.actions.home}
          </Link>
          <button
            onClick={() => history.back()}
            className="relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 w-80"
          >
            {t.actions.back}
          </button>
        </div>
      </div>
    </main>
  );
}
