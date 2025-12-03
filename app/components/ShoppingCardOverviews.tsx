// app/components/ShoppingCardOverviews.tsx
"use client";
import Image from "next/image";
import Link from "next/link";

import {
  QuestionMarkCircleIcon,
  XMarkIcon as XMarkIconMini,
} from "@heroicons/react/20/solid";
import { useCart } from "@/app/context/CartContext";

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
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  const hasItems = items.length > 0;
  const shippingCost = hasItems ? 5.0 : 0;
  const taxRate = 0.084;
  const taxAmount = hasItems ? totalPrice * taxRate : 0;
  const orderTotal = totalPrice + shippingCost + taxAmount;

  return (
    <div className="">
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl tracking-tight font-semibold text-yellow-400 max-w-md">
          {shoppingCart}
        </h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              {description}
            </h2>

            {!hasItems ? (
              <div className="py-16 ">
                <p className="text-gray-400 text-lg">{empty}</p>
                <p className="text-gray-500 my-2">{emptyDescription}</p>
                <Link
                  href={`/${lang}/shop`}
                  className="relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 w-70 mt-10"
                >
                  {CTAAdd}
                </Link>
              </div>
            ) : (
              <ul
                role="list"
                className="divide-y divide-gray-200 border-b border-t border-gray-200"
              >
                {items.map((product) => (
                  <li key={product.id} className="flex py-6 sm:py-10">
                    <div className="shrink-0 size-24 sm:size-48 relative rounded-lg bg-stone-600 overflow-hidden">
                      <Image
                        width={640}
                        height={640}
                        alt={product.imageAlt}
                        src={product.imageSrc}
                        className="object-contain p-3 w-full h-full"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-lg font-medium text-white pr-6">
                              <span className="font-medium text-yellow-400">
                                {product.name}
                              </span>
                            </h3>
                          </div>
                          <div className="mt-1 flex text-base text-gray-200">
                            {product.country && (
                              <p className="text-gray-300">{product.country}</p>
                            )}
                            {product.size && (
                              <p className="ml-4 border-l border-gray-200 pl-4 text-gray-300">
                                {product.size}
                              </p>
                            )}
                            {product.abv && (
                              <p className="ml-4 border-l border-gray-200 pl-4 text-gray-300">
                                {product.abv}%
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="absolute right-0 top-0 mt-4 sm:mt-0 sm:pr-9 flex flex-col gap-5">
                          <div className="">
                            <div className="flex gap-8 items-center">
                              <p className="mt-1 text-base font-medium text-gray-300">
                                {(product.price * product.quantity).toFixed(2)}{" "}
                                €
                              </p>
                              <button
                                type="button"
                                onClick={() => removeFromCart(product.id)}
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
                                updateQuantity(product.id, product.quantity - 1)
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
                                updateQuantity(product.id, product.quantity + 1)
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
                ))}
              </ul>
            )}
          </section>

          {/* Order summary - only show when cart has items */}
          {hasItems && (
            <section
              aria-labelledby="summary-heading"
              className="mt-16 rounded-lg bg-white/5 border border-white/10 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
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
                    <a
                      href="#"
                      className="ml-2 shrink-0 text-gray-400 hover:text-gray-300"
                    >
                      <span className="sr-only">{shippingEstimateInfo}</span>
                      <QuestionMarkCircleIcon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </a>
                  </dt>
                  <dd className="text-base font-medium text-gray-400">
                    {shippingCost.toFixed(2)} €
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="flex text-base text-gray-400">
                    <span>{taxEstimate}</span>
                    <a
                      href="#"
                      className="ml-2 shrink-0 text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">{taxEstimateInfo}</span>
                      <QuestionMarkCircleIcon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </a>
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

              <div className="mt-6">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 hover:border-yellow-600 sm:w-auto lg:w-full duration-300"
                >
                  {checkout}
                </button>
              </div>
            </section>
          )}
        </form>
      </main>
    </div>
  );
}

// const relatedProducts = [
//   {
//     id: 1,
//     name: "Billfold Wallet",
//     href: "#",
//     imageSrc:
//       "https://tailwindcss.com/plus-assets/img/ecommerce-images/shopping-cart-page-01-related-product-01.jpg",
//     imageAlt: "Front of Billfold Wallet in natural leather.",
//     price: "$118",
//     color: "Natural",
//   },
//   {
//     id: 2,
//     name: "Machined Pen and Pencil Set",
//     href: "#",
//     imageSrc:
//       "https://tailwindcss.com/plus-assets/img/ecommerce-images/shopping-cart-page-01-related-product-02.jpg",
//     imageAlt:
//       "Black machined pen and pencil with hexagonal shaft and small white logo.",
//     price: "$70",
//     color: "Black",
//   },
//   {
//     id: 3,
//     name: "Mini Sketchbook Set",
//     href: "#",
//     imageSrc:
//       "https://tailwindcss.com/plus-assets/img/ecommerce-images/shopping-cart-page-01-related-product-03.jpg",
//     imageAlt:
//       "Three mini sketchbooks with tan and charcoal typography poster covers.",
//     price: "$28",
//     color: "Tan and Charcoal",
//   },
//   {
//     id: 4,
//     name: "Organize Set",
//     href: "#",
//     imageSrc:
//       "https://tailwindcss.com/plus-assets/img/ecommerce-images/shopping-cart-page-01-related-product-04.jpg",
//     imageAlt:
//       "Grooved walnut desk organizer base with five modular white plastic organizer trays.",
//     price: "$149",
//     color: "Walnut",
//   },
// ];

//    Related products
//         <section aria-labelledby="related-heading" className="mt-24">
//           <h2
//             id="related-heading"
//             className="text-lg font-medium text-gray-900"
//           >
//             You may also like&hellip;
//           </h2>

//           <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
//             {relatedProducts.map((relatedProduct) => (
//               <div key={relatedProduct.id} className="group relative">
//                 <Image
//                   width={640}
//                   height={640}
//                   alt={relatedProduct.imageAlt}
//                   src={relatedProduct.imageSrc}
//                   className="aspect-square w-full rounded-md object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
//                 />
//                 <div className="mt-4 flex justify-between">
//                   <div>
//                     <h3 className="text-sm text-gray-700">
//                       <a href={relatedProduct.href}>
//                         <span aria-hidden="true" className="absolute inset-0" />
//                         {relatedProduct.name}
//                       </a>
//                     </h3>
//                     <p className="mt-1 text-sm text-gray-500">
//                       {relatedProduct.color}
//                     </p>
//                   </div>
//                   <p className="text-sm font-medium text-gray-900">
//                     {relatedProduct.price}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
