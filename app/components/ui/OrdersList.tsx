"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/app/lib/locale";

export type AccountOrdersMessages = {
  title: string;
  intro: string;
  recentOrdersSrOnly: string;
  orderPlacedOnSrOnly: string;
  datePlaced: string;
  orderNumber: string;
  totalAmount: string;
  hideDetails: string;
  viewDetails: string;
  productsSrOnly: string;
  productHeader: string;
  priceHeader: string;
  statusHeader: string;
  infoHeader: string;
  viewProduct: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyCta: string;

  statusPaid: string;
  statusPending: string;
  statusAuthorized: string;
  statusPartiallyPaid: string;
  statusRefunded: string;
  statusPartiallyRefunded: string;
  statusVoided: string;
  statusFulfilled: string;
  statusUnfulfilled: string;
  statusPartiallyFulfilled: string;
  statusUnknown: string;
};

export type OrderProduct = {
  id: string;
  name: string;
  href: string;
  price: string;
  status: string;
  imageSrc: string;
  imageAlt: string;
};

export type OrderForUi = {
  number: string;
  date: string;
  datetime: string;
  total: string;
  products: OrderProduct[];

  statusUrl?: string | null;

  trackingCompany?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shipmentStatus?: string | null;
};

type OrdersListProps = {
  messages: AccountOrdersMessages;
  lang: Locale;
  orders: OrderForUi[];
};

type TrackingTranslations = {
  title: string;
  trackingNumber: string;
  carrier: string;
  trackOrder: string;
};

const TRACKING_TRANSLATIONS: Record<
  Locale,
  TrackingTranslations
> = {
  en: {
    title: "Shipment tracking",
    trackingNumber: "Tracking number",
    carrier: "Carrier",
    trackOrder: "Track order",
  },
  ru: {
    title: "Отслеживание доставки",
    trackingNumber: "Номер отправления",
    carrier: "Перевозчик",
    trackOrder: "Отследить заказ",
  },
  uk: {
    title: "Відстеження доставки",
    trackingNumber: "Номер відправлення",
    carrier: "Перевізник",
    trackOrder: "Відстежити замовлення",
  },
  et: {
    title: "Saadetise jälgimine",
    trackingNumber: "Jälgimisnumber",
    carrier: "Vedaja",
    trackOrder: "Jälgi tellimust",
  },
  fi: {
    title: "Lähetyksen seuranta",
    trackingNumber: "Seurantanumero",
    carrier: "Kuljetusyhtiö",
    trackOrder: "Seuraa tilausta",
  },
};

export default function OrdersList({
  messages,
  lang,
  orders,
}: OrdersListProps) {
  const [openOrderNumber, setOpenOrderNumber] =
    useState<string | null>(null);

  const trackingTexts =
    TRACKING_TRANSLATIONS[lang] ??
    TRACKING_TRANSLATIONS.en;

  const toggleOrder = (number: string) => {
    setOpenOrderNumber((current) =>
      current === number ? null : number,
    );
  };

  const hasOrders = orders.length > 0;

  return (
    <main className="mt-10 space-y-6 lg:col-span-8 lg:mt-0">
      <div>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {messages.title}
            </h1>

            <p className="mt-4 text-base text-gray-400">
              {messages.intro}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="sr-only">
            {messages.recentOrdersSrOnly}
          </h2>

          {!hasOrders ? (
            <div className="py-16">
              <p className="text-lg text-gray-400">
                {messages.emptyTitle}
              </p>

              <p className="my-2 text-gray-500">
                {messages.emptyDescription}
              </p>

              <Link
                href={`/${lang}/shop`}
                className="relative mt-10 flex w-fit items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {messages.emptyCta}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const isOpen =
                  openOrderNumber === order.number;

                const hasTracking = Boolean(
                  order.trackingNumber ||
                    order.trackingUrl ||
                    order.trackingCompany,
                );

                const safeOrderNumber =
                  order.number.replace(
                    /[^a-zA-Z0-9_-]/g,
                    "",
                  ) || "order";

                const detailsId =
                  `order-${safeOrderNumber}-details`;

                return (
                  <article key={order.number}>
                    <h3 className="sr-only">
                      {messages.orderPlacedOnSrOnly}{" "}
                      <time dateTime={order.datetime}>
                        {order.date}
                      </time>
                    </h3>

                    <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-6 text-sm text-gray-200 sm:px-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[minmax(130px,1fr)_minmax(140px,1fr)_100px_161px] lg:items-start lg:gap-6">
                        <dl className="contents">
                          <div>
                            <dt className="font-medium text-gray-400">
                              {messages.datePlaced}
                            </dt>

                            <dd className="mt-1 text-white">
                              <time
                                dateTime={order.datetime}
                              >
                                {order.date}
                              </time>
                            </dd>
                          </div>

                          <div>
                            <dt className="font-medium text-gray-400">
                              {messages.orderNumber}
                            </dt>

                            <dd className="mt-1 text-white">
                              {order.number}
                            </dd>
                          </div>

                          <div className="sm:text-right lg:text-right">
                            <dt className="font-medium text-white">
                              {messages.totalAmount}
                            </dt>

                            <dd className="mt-1 font-medium text-yellow-400">
                              {order.total}
                            </dd>
                          </div>
                        </dl>

                        <div className="flex w-full flex-col gap-2">
                          {order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
                            >
                              {trackingTexts.trackOrder}
                            </a>
                          ) : null}

                          <button
                            type="button"
                            onClick={() =>
                              toggleOrder(order.number)
                            }
                            aria-expanded={isOpen}
                            aria-controls={detailsId}
                            className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/25 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                          >
                            {isOpen
                              ? messages.hideDetails
                              : messages.viewDetails}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isOpen ? (
                      <div id={detailsId}>
                        {hasTracking ? (
                          <section className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-5 sm:mt-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <h4 className="font-semibold text-white">
                                  {trackingTexts.title}
                                </h4>

                                <dl className="mt-4 space-y-3 text-sm">
                                  {order.trackingNumber ? (
                                    <div>
                                      <dt className="text-gray-400">
                                        {
                                          trackingTexts.trackingNumber
                                        }
                                      </dt>

                                      <dd className="mt-1 break-all font-medium text-white">
                                        {
                                          order.trackingNumber
                                        }
                                      </dd>
                                    </div>
                                  ) : null}

                                  {order.trackingCompany ? (
                                    <div>
                                      <dt className="text-gray-400">
                                        {trackingTexts.carrier}
                                      </dt>

                                      <dd className="mt-1 font-medium text-white">
                                        {
                                          order.trackingCompany
                                        }
                                      </dd>
                                    </div>
                                  ) : null}
                                </dl>
                              </div>

                              {order.trackingUrl ? (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex w-full items-center justify-center rounded-md bg-yellow-400 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-neutral-900 sm:w-auto"
                                >
                                  {trackingTexts.trackOrder}
                                </a>
                              ) : null}
                            </div>
                          </section>
                        ) : null}

                        <div className="mt-4 overflow-x-auto sm:mt-6">
                          <table className="w-full min-w-[640px] text-gray-400">
                            <caption className="sr-only">
                              {messages.productsSrOnly}
                            </caption>

                            <thead className="text-left text-sm text-gray-400">
                              <tr>
                                <th
                                  scope="col"
                                  className="py-3 pr-8 font-normal sm:w-2/5 lg:w-1/3"
                                >
                                  {messages.productHeader}
                                </th>

                                <th
                                  scope="col"
                                  className="w-1/5 py-3 pr-8 font-normal"
                                >
                                  {messages.priceHeader}
                                </th>

                                <th
                                  scope="col"
                                  className="py-3 pr-8 font-normal"
                                >
                                  {messages.statusHeader}
                                </th>

                                <th
                                  scope="col"
                                  className="w-0 py-3 text-right font-normal"
                                >
                                  {messages.infoHeader}
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-500 border-y border-gray-500 text-sm">
                              {order.products.map(
                                (product) => (
                                  <tr key={product.id}>
                                    <td className="py-6 pr-8">
                                      <div className="flex items-center">
                                        <div className="relative mr-6 size-16 shrink-0 overflow-hidden rounded-lg bg-stone-600">
                                          <Image
                                            src={
                                              product.imageSrc
                                            }
                                            alt={
                                              product.imageAlt
                                            }
                                            fill
                                            sizes="64px"
                                            className="object-contain p-2"
                                          />
                                        </div>

                                        <div className="font-medium text-white">
                                          {product.name}
                                        </div>
                                      </div>
                                    </td>

                                    <td className="py-6 pr-8">
                                      {product.price}
                                    </td>

                                    <td className="py-6 pr-8">
                                      {product.status}
                                    </td>

                                    <td className="whitespace-nowrap py-6 text-right font-medium">
                                      <Link
                                        href={product.href}
                                        className="text-yellow-400 transition-colors duration-200 hover:text-white focus:text-white"
                                      >
                                        {messages.viewProduct}

                                        <span className="sr-only">
                                          , {product.name}
                                        </span>
                                      </Link>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}