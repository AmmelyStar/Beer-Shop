// app/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/app/lib/locale";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ProfileButton from "./ui/ProfileButton";
import HeaderSearch from "./ui/HeaderSearch";
import ShoppingCart, { ShoppingCartMsgs } from "./ui/ShoppingCart";

type ShoppingCartMessages = ShoppingCartMsgs;

type HeaderNavMessages = {
  home: string;
  shop: string;
  contacts: string;
};

const SHOPPING_CART_FALLBACK: ShoppingCartMessages = {
  ariaLabel: "Shopping cart",
  emptyMessage: "Your cart is empty",
  checkoutButton: "Proceed to Checkout",
  itemsInCart: "items in cart, view bag",
};

const HEADER_NAV_FALLBACK: HeaderNavMessages = {
  home: "Home",
  shop: "Shop",
  contacts: "Contacts",
};

type Props = {
  lang: Locale;
  messages?: {
    ShoppingCart?: ShoppingCartMessages;
    HeaderNav?: HeaderNavMessages;
  };
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium tracking-wide text-white/80 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

export default function Header({ lang, messages }: Props) {
  const cartMessages: ShoppingCartMessages =
    messages?.ShoppingCart ?? SHOPPING_CART_FALLBACK;

  const nav: HeaderNavMessages = messages?.HeaderNav ?? HEADER_NAV_FALLBACK;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        {/* 3-column grid: Left Nav | Center Brand | Right Controls */}
        <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center">
          {/* LEFT: NAV */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6"
          >
            <NavLink href={`/${lang}`} label={nav.home} />
            <NavLink href={`/${lang}/shop`} label={nav.shop} />
            <NavLink href={`/${lang}/contact`} label={nav.contacts} />
          </nav>

          {/* LEFT (mobile): spacer */}
          <div className="md:hidden" />

          {/* CENTER: BEER [logo] SNACKS */}
          <Link
            href={`/${lang}`}
            className="mx-auto flex items-center gap-3 uppercase font-semibold tracking-[0.22em] text-white"
            aria-label="Beer & Snacks"
          >
            <span>Beer</span>

            <Image
              src="/category/logo-beer.jpg"
              alt="Beer & Snacks"
              width={36}
              height={36}
              className="rounded-full object-cover ring-1 ring-white/15"
              priority
            />

            <span>Snacks</span>
          </Link>

          {/* RIGHT: CONTROLS */}
          <div className="flex items-center justify-end gap-3">
            <LanguageSwitcher current={lang} />
            <HeaderSearch lang={lang} />
            <ProfileButton lang={lang} />

            <span
              aria-hidden="true"
              className="mx-3 hidden sm:block h-6 w-px bg-white/15"
            />

            <ShoppingCart
              lang={lang}
              href={`/${lang}/cart`}
              messages={cartMessages}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
