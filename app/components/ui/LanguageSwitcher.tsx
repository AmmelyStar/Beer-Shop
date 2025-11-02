"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/app/lib/locale";

function buildHref(target: Locale, pathname: string, search: string) {
  const segs = pathname.split("/"); // ['', 'en', ...]
  if (LOCALES.includes(segs[1] as Locale)) segs[1] = target;
  else segs.splice(1, 0, target);
  const base = segs.join("/") || "/";
  return search ? `${base}?${search}` : base;
}

export default function LanguageSwitcher({ current }: { current?: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams()?.toString() || "";

  const detected: Locale = useMemo(() => {
    const code = pathname.split("/")[1];
    return LOCALES.includes(code as Locale) ? (code as Locale) : "en";
  }, [pathname]);

  const active = current ?? detected;

  return (
    <Popover className="relative">
      <PopoverButton className="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-200 hover:text-yellow-500">
        <span>{LOCALE_LABEL[active]}</span>
        <ChevronDownIcon aria-hidden="true" className="size-5" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute left-1/2 z-50 mt-5 -translate-x-1/2
    w-auto
    px-4 py-3
    data-closed:translate-y-1 data-closed:opacity-0
    data-enter:duration-200 data-leave:duration-150 data-enter:ease-out data-leave:ease-in

    rounded-2xl shadow-2xl shadow-black/50
    ring-1 ring-white/15 dark:ring-stone/20
    bg-linear-to-b from-white/55 to-white/20
    dark:from-stone-950/75 dark:to-stone-950/80
    backdrop-blur-sm"
      >
        <div className="w-56 shrink rounded-xl  p-4 text-sm/6 font-semibold text-gray-200 shadow-lg  outline-1 outline-gray-900/5">
          {LOCALES.map((loc) => {
            const href = buildHref(loc, pathname, search);
            const isActive = loc === active;
            return (
              <Link
                key={loc}
                href={href}
                className={`block rounded-md p-2 ${
                  isActive
                    ? "text-yellow-500 bg-linear-to-br from-stone-300/20 to-stone-900/50 "
                    : "hover:text-yellow-500"
                }`}
                aria-current={isActive ? "true" : undefined}
                prefetch={false}
              >
                {LOCALE_LABEL[loc]}
              </Link>
            );
          })}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
