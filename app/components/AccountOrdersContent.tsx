// app/components/AccountOrdersContent.tsx

"use client";

import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";

import type { Locale } from "@/app/lib/locale";
import { AccountSidebar } from "@/app/components/ui/AccountSidebar";
import OrdersList, {
  type AccountOrdersMessages,
  type OrderForUi,
} from "@/app/components/ui/OrdersList";

type AccountPageMessages = {
  signingOut: string;
  signOut: string;
  sidebarGreeting: string;
  tabProfile: string;
  tabOrders: string;
  tabReviews: string;
  tabAddresses: string;
};

type AccountOrdersContentProps = {
  accountMessages: AccountPageMessages;
  ordersMessages: AccountOrdersMessages;
};

type ApiLineItem = {
  id: number;
  productId: number | null;
  variantId: number | null;
  name: string;
  quantity: number;
  price: string;
  handle: string | null;
  imageSrc: string | null;
  imageAlt: string;
};

type ApiOrder = {
  id: number;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  totalPrice: string;
  currency: string;
  statusUrl?: string | null;
  lineItems: ApiLineItem[];
};

type ApiResponse = {
  orders?: ApiOrder[];
  error?: string;
};

const localeByLanguage: Record<string, string> = {
  en: "en-GB",
  uk: "uk-UA",
  ru: "ru-RU",
  et: "et-EE",
  fi: "fi-FI",
};

function translateStatus(
  status: string | null | undefined,
  messages: AccountOrdersMessages,
): string {
  if (!status) {
    return messages.statusUnknown;
  }

  const normalizedStatus = status.toLowerCase();

  const statusTranslations: Record<string, string> = {
    paid: messages.statusPaid,
    pending: messages.statusPending,
    authorized: messages.statusAuthorized,
    partially_paid: messages.statusPartiallyPaid,
    refunded: messages.statusRefunded,
    partially_refunded: messages.statusPartiallyRefunded,
    voided: messages.statusVoided,
    fulfilled: messages.statusFulfilled,
    unfulfilled: messages.statusUnfulfilled,
    partial: messages.statusPartiallyFulfilled,
    partially_fulfilled: messages.statusPartiallyFulfilled,
  };

  return (
    statusTranslations[normalizedStatus] ??
    messages.statusUnknown
  );
}

function formatMoney(
  amount: string,
  currency: string,
  locale: string,
): string {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return `${amount} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatOrderDate(
  value: string,
  locale: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function AccountOrdersContent({
  accountMessages,
  ordersMessages,
}: AccountOrdersContentProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const params = useParams();

  const [loadingLogout, setLoadingLogout] =
    useState(false);

  const [orders, setOrders] =
    useState<OrderForUi[] | null>(null);

  const langFromParams = params?.lang;

  const lang = (
    Array.isArray(langFromParams)
      ? langFromParams[0]
      : langFromParams
  ) as Locale | undefined;

  const effectiveLang = (lang || "en") as Locale;
  const formattingLocale =
    localeByLanguage[effectiveLang] ?? "en-GB";

  const baseAccountPath =
    `/${effectiveLang}/account`;

  const navItems = [
    {
      href: baseAccountPath,
      label: accountMessages.tabProfile,
    },
    {
      href: `${baseAccountPath}/orders`,
      label: accountMessages.tabOrders,
    },
    {
      href: `${baseAccountPath}/reviews`,
      label: accountMessages.tabReviews,
    },
  ];

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        const response = await fetch(
          "/api/account/orders",
          {
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ApiResponse;

        if (!response.ok) {
          console.warn(
            "Failed to load orders:",
            data.error ?? response.statusText,
          );

          if (!cancelled) {
            setOrders([]);
          }

          return;
        }

        const apiOrders = data.orders ?? [];

        const uiOrders: OrderForUi[] =
          apiOrders.map((order) => {
            const rawStatus =
              order.fulfillmentStatus ??
              order.financialStatus;

            return {
              number: order.name,
              date: formatOrderDate(
                order.createdAt,
                formattingLocale,
              ),
              datetime: order.createdAt,
              total: formatMoney(
                order.totalPrice,
                order.currency,
                formattingLocale,
              ),
              statusUrl: order.statusUrl ?? null,

              products: (order.lineItems ?? []).map(
                (lineItem) => ({
                  id: String(lineItem.id),

                  name:
                    lineItem.quantity > 1
                      ? `${lineItem.name} × ${lineItem.quantity}`
                      : lineItem.name,

                  href: lineItem.handle
  ? `/${effectiveLang}/product/${lineItem.handle}`
  : `/${effectiveLang}/shop`,

                  price: formatMoney(
                    lineItem.price,
                    order.currency,
                    formattingLocale,
                  ),

                  status: translateStatus(
                    rawStatus,
                    ordersMessages,
                  ),

                  imageSrc:
                    lineItem.imageSrc ??
                    "/placeholder.png",

                  imageAlt:
                    lineItem.imageAlt ||
                    lineItem.name,
                }),
              ),
            };
          });

        if (!cancelled) {
          setOrders(uiOrders);
        }
      } catch (error: unknown) {
        console.warn(
          "Orders load error:",
          error instanceof Error
            ? error.message
            : String(error),
        );

        if (!cancelled) {
          setOrders([]);
        }
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    effectiveLang,
    formattingLocale,
    ordersMessages,
  ]);

  const handleSignOut = async () => {
    setLoadingLogout(true);

    try {
      await signOut({
        redirectUrl: `/${effectiveLang}/account`,
      });
    } catch (error: unknown) {
      console.error(
        "Sign out error:",
        error instanceof Error
          ? error.message
          : String(error),
      );

      setLoadingLogout(false);
    }
  };

  if (!isLoaded) {
    return (
      <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-yellow-400" />
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        <AccountSidebar
          user={user}
          navItems={navItems}
          baseAccountPath={baseAccountPath}
          effectiveLang={effectiveLang}
          onSignOut={handleSignOut}
          signingOutLabel={
            accountMessages.signingOut
          }
          signOutLabel={accountMessages.signOut}
          greetingLabel={
            accountMessages.sidebarGreeting
          }
          loading={loadingLogout}
        />

        <OrdersList
          messages={ordersMessages}
          lang={effectiveLang}
          orders={orders ?? []}
        />
      </div>
    </section>
  );
}