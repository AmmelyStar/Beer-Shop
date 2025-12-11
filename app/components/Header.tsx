// app/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/app/lib/locale";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ProfileButton from "./ui/ProfileButton";
import HeaderSearch from "./ui/HeaderSearch";
import ShoppingCart, { ShoppingCartMsgs } from "./ui/ShoppingCart";

// Тексты для блока ShoppingCart
type ShoppingCartMessages = ShoppingCartMsgs;

const SHOPPING_CART_FALLBACK: ShoppingCartMessages = {
  ariaLabel: "Shopping cart",
  emptyMessage: "Your cart is empty",
  checkoutButton: "Proceed to Checkout",
  itemsInCart: "items in cart, view bag",
};

type Props = {
  lang: Locale;
  messages?: {
    ShoppingCart?: ShoppingCartMessages;
  };
};

export default function Header({ lang, messages }: Props) {
  const cartMessages: ShoppingCartMessages =
    messages?.ShoppingCart ?? SHOPPING_CART_FALLBACK;

  return (
    <header className="relative z-10 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        
        {/* 🔥 LOGO LEFT */}
        <Link href={`/${lang}`} className="flex items-center">
          <Image
            src="/category/logo-beer.jpg"     // 👉 заменишь на свой файл
            alt="Logo"
            width={120}         // можно изменить
            height={40}
            className="object-contain"
            priority
          />
        </Link>

        {/* RIGHT SIDE CONTROLS */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={lang} />
          <HeaderSearch lang={lang} />
          <ProfileButton lang={lang} />
          <span aria-hidden="true" className="mx-4 h-6 w-px bg-gray-400" />
          <ShoppingCart
            lang={lang}
            href={`/${lang}/cart`}
            messages={cartMessages}
          />
        </div>

      </div>
    </header>
  );
}
