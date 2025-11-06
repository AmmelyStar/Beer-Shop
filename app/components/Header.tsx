// app/components/Header.tsx

"use client";

import type { Locale } from "@/app/lib/locale";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ProfileButton from "./ui/ProfileButton";
import HeaderSearch from "./ui/HeaderSearch";
import ShoppingCart from "./ui/ShoppingCart";

// Тип всей структуры сообщений берём из эталона en.json
type AllMessages = typeof import("../messages/en.json");

// Фолбэк для раздела корзины — на случай, если messages отсутствует
const SHOPPING_CART_FALLBACK: AllMessages["ShoppingCart"] = {
  ariaLabel: "Shopping cart",
  emptyMessage: "Your cart is empty",
  checkoutButton: "Proceed to Checkout",
  itemsInCart: "items in cart, view bag",
};

type Props = {
  lang: Locale;
  messages?: AllMessages; // делаем необязательным, чтобы не падать в рантайме
};

export default function Header({ lang, messages }: Props) {
  // Берём нужный срез или фолбэк
  const cartMessages =
    messages?.ShoppingCart ?? SHOPPING_CART_FALLBACK;

  return (
    <header className="relative z-10 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-6 py-8">
        <LanguageSwitcher current={lang} />
        <HeaderSearch lang={lang} />
        <ProfileButton lang={lang} />
        <span aria-hidden="true" className="mx-4 h-6 w-px bg-gray-400" />
        <ShoppingCart lang={lang} messages={cartMessages} />
      </div>
    </header>
  );
}
