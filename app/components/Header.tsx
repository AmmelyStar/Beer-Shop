// app/components/Header.tsx

"use client";

import type { Locale } from "@/app/lib/locale";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ProfileButton from "./ui/ProfileButton";
import HeaderSearch from "./ui/HeaderSearch";
import ShoppingCart from "./ui/ShoppingCart";

// 🔹 Берём общий тип Messages из messages/index.ts
import type { Messages } from "../messages";

// Тип только для блока ShoppingCart в messages
type ShoppingCartMessages = Messages["ShoppingCart"];

// Фолбэк для раздела корзины — если messages не передали
const SHOPPING_CART_FALLBACK: ShoppingCartMessages = {
  ariaLabel: "Shopping cart",
  emptyMessage: "Your cart is empty",
  checkoutButton: "Proceed to Checkout",
  itemsInCart: "items in cart, view bag",
};

type Props = {
  lang: Locale;
  messages?: Messages; // весь объект messages, как в других местах
};

export default function Header({ lang, messages }: Props) {
  // Берём нужный срез или фолбэк
  const cartMessages: ShoppingCartMessages =
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
