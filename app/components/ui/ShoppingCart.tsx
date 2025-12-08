// app/components/ui/ShoppingCart.tsx
"use client";

import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import type { Locale } from "../../lib/locale";

export type ShoppingCartMsgs = {
  ariaLabel: string;
  emptyMessage: string;
  checkoutButton: string;
  itemsInCart: string;
};

const FALLBACK: ShoppingCartMsgs = {
  ariaLabel: "Shopping cart",
  emptyMessage: "Your cart is empty",
  checkoutButton: "Proceed to Checkout",
  itemsInCart: "items in cart",
};

export default function ShoppingCart({
  lang = "en",
  href = "/cart",
  messages,
}: {
  lang?: Locale | string;
  href?: string;
  messages: ShoppingCartMsgs;
}) {
  // Берём количество из контекста
  const { totalQuantity } = useCart();
  const itemCount = totalQuantity ?? 0;

  // Берём тексты или фолбэк
  const dict = messages ?? FALLBACK;

  const label =
    itemCount > 0
      ? `${dict.ariaLabel}: ${itemCount} ${dict.itemsInCart}`
      : `${dict.ariaLabel}: ${dict.emptyMessage}`;

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      title={label}
      className="group -m-2 flex items-center p-2 relative"
    >
      <ShoppingCartIcon
        aria-hidden="true"
        className="size-6 shrink-0 text-gray-400 group-hover:text-yellow-500 transition-colors"
      />

      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-gray-900">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}

      <span className="sr-only">{label}</span>
    </Link>
  );
}
