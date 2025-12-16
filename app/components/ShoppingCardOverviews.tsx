"use client";

import Image from "next/image";
import Link from "next/link";
import {
  QuestionMarkCircleIcon,
  XMarkIcon as XMarkIconMini,
} from "@heroicons/react/20/solid";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import type { Locale } from "../lib/locale";

type ShoppingCardOverviewsProps = {
  shoppingCart: string;
  description: string;
  orderSummary: string;
  subtotal: string;
  shippingEstimate: string;
  taxEstimate: string;
  total: string;
  checkout: string;
  shippingEstimateInfo: string;
  taxEstimateInfo: string;
  empty: string;
  emptyDescription: string;
  CTAAdd: string;
  lang: Locale;
};

function getContinueShoppingText(lang: Locale) {
  switch (lang) {
    case "ru":
      return "← Продолжить покупки";
    case "uk":
      return "← Продовжити покупки";
    case "et":
      return "← Jätka ostlemist";
    case "fi":
      return "← Jatka ostoksia";
    default:
      return "← Continue shopping";
  }
}

// ✅ роут товара
function productHref(lang: Locale, handle: string) {
  return `/${lang}/product/${handle}`;
}

// ✅ достаём handle / productHandle
function getProductHandle(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const rec = value as Record<string, unknown>;
  const candidate = rec.handle ?? rec.productHandle;

  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : null;
}

export default function ShoppingCardOverviews({
  shoppingCart,
  description,
  orderSummary,
  subtotal,
  shippingEstimate,
  taxEstimate,
  total,
  checkout,
  shippingEstimateInfo,
  taxEstimateInfo,
  empty,
  emptyDescription,
  CTAAdd,
  lang,
}: ShoppingCardOverviewsProps) {
  const { cart, isLoading, removeLine, updateLineQuantity, clearCart } =
    useCart();

  const items = cart.lines;
  const hasItems = items.length > 0;

  const totalPrice = items.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  const shippingCost = hasItems ? 5.0 : 0;
  const taxRate = 0.084;
  const taxAmount = hasItems ? totalPrice * taxRate : 0;
  const orderTotal = totalPrice + shippingCost + taxAmount;

  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleCheckoutClick = () => {
    if (!cart.checkoutUrl) return;

    if (isSignedIn) {
      router.push(cart.checkoutUrl);
    } else {
      const redirectTo = encodeURIComponent(cart.checkoutUrl);
      router.push(`/account?redirectTo=${redirectTo}`);
    }
  };

  return (
    <div>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl tracking-tight font-semibold text-yellow-400 max-w-md">
          {shoppingCart}
        </h1>

        {isLoading && !cart.cartId ? (
          <p className="mt-8 text-gray-400">Loading cart...</p>
        ) : (
          <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
            <section aria-labelledby="cart-heading" className="lg:col-span-7">
              <h2 id="cart-heading" className="sr-only">
                {description}
              </h2>

              {!hasItems ? (
                <div className="py-16">
                  <p className="text-gray-400 text-lg">{empty}</p>
                  <p className="text-gray-500 my-2">{emptyDescription}</p>

                  <Link
                    href="/shop"
                    prefetch={false}
                    className="relative mt-10 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    {CTAAdd}
                  </Link>
                </div>
              ) : (
                <ul
                  role="list"
                  className="divide-y divide-gray-200 border-b border-t border-gray-200"
                >
                  {items.map((product) => {
                    const handle = getProductHandle(product);
                    const canLink = Boolean(handle);
                    const href = canLink ? productHref(lang, handle!) : null;

                    return (
                      <li key={product.id} className="flex py-6 sm:py-10">
                        <div className="shrink-0 size-24 sm:size-48 relative rounded-lg bg-stone-600 overflow-hidden">
                          {product.imageUrl && href ? (
                            <Link
                              href={href}
                              prefetch={false}
                              className="block w-full h-full"
                              aria-label={product.title}
                            >
                              <Image
                                width={640}
                                height={640}
                                alt={product.imageAlt}
                                src={product.imageUrl}
                                className="object-contain p-3 w-full h-full"
                              />
                            </Link>
                          ) : product.imageUrl ? (
                            <Image
                              width={640}
                              height={640}
                              alt={product.imageAlt}
                              src={product.imageUrl}
                              className="object-contain p-3 w-full h-full"
                            />
                          ) : null}
                        </div>

                        <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                          <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                            <div>
                              <div className="flex justify-between">
                                <h3 className="text-lg font-medium pr-6">
                                  {href ? (
                                    <Link
                                      href={href}
                                      prefetch={false}
                                      className="text-yellow-400 hover:opacity-80"
                                    >
                                      {product.title}
                                    </Link>
                                  ) : (
                                    <span className="text-yellow-400">
                                      {product.title}
                                    </span>
                                  )}
                                </h3>
                              </div>

                              {/* ✅ ВОТ ОНА: ссылка "Просмотреть товар" на каждый item */}
                              {href && (
                                <div className="mt-1">
                                  <Link
                                    href={href}
                                    prefetch={false}
                                    className="text-sm text-gray-300 underline underline-offset-4 hover:text-white"
                                  >
                                    Просмотреть товар
                                  </Link>
                                </div>
                              )}
                            </div>

                            <div className="absolute right-0 top-0 mt-4 sm:mt-0 sm:pr-9 flex flex-col gap-5">
                              <div>
                                <div className="flex gap-8 items-center">
                                  <p className="mt-1 text-base font-medium text-gray-300">
                                    {(product.unitPrice * product.quantity).toFixed(
                                      2
                                    )}{" "}
                                    €
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => removeLine(product.id)}
                                    className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <span className="sr-only">Remove</span>
                                    <XMarkIconMini
                                      aria-hidden="true"
                                      className="size-5"
                                    />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateLineQuantity(
                                      product.id,
                                      Math.max(1, product.quantity - 1)
                                    )
                                  }
                                  className="flex size-8 items-center justify-center rounded-md border border-gray-400 text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                  <span className="sr-only">Decrease quantity</span>
                                  <span className="text-lg font-medium">−</span>
                                </button>

                                <span className="w-8 text-center text-base text-gray-200">
                                  {product.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateLineQuantity(product.id, product.quantity + 1)
                                  }
                                  className="flex size-8 items-center justify-center rounded-md border border-gray-400 text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                  <span className="sr-only">Increase quantity</span>
                                  <span className="text-lg font-medium">+</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {hasItems && (
              <div className="mt-16 lg:col-span-5 lg:mt-0">
                <section
                  aria-labelledby="summary-heading"
                  className="rounded-lg bg-white/5 border border-white/10 sm:p-6 lg:p-8"
                >
                  <h2
                    id="summary-heading"
                    className="text-lg text-white font-semibold whitespace-nowrap"
                  >
                    {orderSummary}
                  </h2>

                  <dl className="mt-6 space-y-4 pb-8">
                    <div className="flex items-center justify-between">
                      <dt className="text-base text-gray-300">{subtotal}</dt>
                      <dd className="text-sm font-medium text-gray-300">
                        {totalPrice.toFixed(2)} €
                      </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="flex items-center text-base text-gray-400">
                        <span>{shippingEstimate}</span>
                        <button
                          type="button"
                          className="ml-2 shrink-0 text-gray-400 hover:text-gray-300"
                        >
                          <span className="sr-only">{shippingEstimateInfo}</span>
                          <QuestionMarkCircleIcon
                            aria-hidden="true"
                            className="size-5"
                          />
                        </button>
                      </dt>
                      <dd className="text-base font-medium text-gray-400">
                        {shippingCost.toFixed(2)} €
                      </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="flex text-base text-gray-400">
                        <span>{taxEstimate}</span>
                        <button
                          type="button"
                          className="ml-2 shrink-0 text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">{taxEstimateInfo}</span>
                          <QuestionMarkCircleIcon
                            aria-hidden="true"
                            className="size-5"
                          />
                        </button>
                      </dt>
                      <dd className="text-base font-medium text-gray-400">
                        {taxAmount.toFixed(2)} €
                      </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <dt className="text-base font-medium text-yellow-400">
                        {total}
                      </dt>
                      <dd className="text-base font-medium text-yellow-400">
                        {orderTotal.toFixed(2)} €
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 space-y-3">
                    {cart.checkoutUrl && (
                      <button
                        type="button"
                        onClick={handleCheckoutClick}
                        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 hover:border-yellow-600 lg:w-full duration-300"
                      >
                        {checkout}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => clearCart()}
                      className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-8 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 lg:w-full duration-300"
                    >
                      Clear cart
                    </button>
                  </div>
                </section>

                <Link
                  href="/shop"
                  prefetch={false}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-8 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 duration-300"
                >
                  {getContinueShoppingText(lang)}
                </Link>
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
