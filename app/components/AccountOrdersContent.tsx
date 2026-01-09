// app/components/AccountOrdersContent.tsx
"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/app/lib/locale";
import { AccountSidebar } from "../components/ui/AccountSidebar";
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

// то, что реально приходит из /api/account/orders
type ApiOrder = {
  id: number;
  name: string; // "#1001"
  createdAt: string; // ISO
  financialStatus: string;
  fulfillmentStatus: string | null;
  totalPrice: string;
  currency: string;
  statusUrl?: string | null; // 👈 если ты добавила это в API
  lineItems: { id: number; name: string; quantity: number }[];
};

type ApiResponse = {
  orders?: ApiOrder[];
};

export default function AccountOrdersContent({
  accountMessages,
  ordersMessages,
}: AccountOrdersContentProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const params = useParams();

  const [loadingLogout, setLoadingLogout] = useState(false);
  const [orders, setOrders] = useState<OrderForUi[] | null>(null);

  const langFromParams = params?.lang;
  const lang = (
    Array.isArray(langFromParams) ? langFromParams[0] : langFromParams
  ) as Locale | undefined;
  const effectiveLang = (lang || "en") as Locale;

  const baseAccountPath = `/${effectiveLang}/account`;

  const navItems = [
    { href: baseAccountPath, label: accountMessages.tabProfile },
    { href: `${baseAccountPath}/orders`, label: accountMessages.tabOrders },
    { href: `${baseAccountPath}/reviews`, label: accountMessages.tabReviews },
  ];

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadOrders = async () => {
      try {
        const res = await fetch("/api/account/orders", { cache: "no-store" });

        if (res.status === 401) {
          if (!cancelled) setOrders([]);
          return;
        }

        const data = (await res.json()) as ApiResponse;

        if (!res.ok) {
          console.warn("Failed to load orders", data);
          if (!cancelled) setOrders([]);
          return;
        }

        const apiOrders = data.orders ?? [];

        // ✅ ВОТ ТУТ "ПРИВЯЗКА": преобразуем API → OrderForUi, как ждёт OrdersList
        const uiOrders: OrderForUi[] = apiOrders.map((o) => {
          const dt = new Date(o.createdAt);
          const date = Number.isNaN(dt.getTime())
            ? o.createdAt
            : dt.toLocaleDateString(); // как было — без немецких/австрийских приколов

          return {
            number: o.name,
            date,
            datetime: o.createdAt,
            total: `${o.totalPrice} ${o.currency}`,
            statusUrl: o.statusUrl ?? null,
            products: (o.lineItems ?? []).map((li) => ({
              id: String(li.id),
              name: li.quantity > 1 ? `${li.name} × ${li.quantity}` : li.name,
              href: `/${effectiveLang}/shop`, // если захочешь — сделаем точную ссылку на продукт
              price: "", // в API сейчас нет цены по каждой позиции
              status: o.fulfillmentStatus ?? o.financialStatus ?? "",
              imageSrc: "/placeholder.png", // положи placeholder.png в /public
              imageAlt: li.name,
            })),
          };
        });

        if (!cancelled) setOrders(uiOrders);
      } catch (e) {
        console.warn("Orders load error", e);
        if (!cancelled) setOrders([]);
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user, effectiveLang]);

  const handleSignOut = async () => {
    setLoadingLogout(true);
    try {
      await signOut({ redirectUrl: `/${effectiveLang}/account` });
    } catch (error) {
      console.error("Sign out error:", error);
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

  if (!user) return null;

  return (
    <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        <AccountSidebar
          user={user}
          navItems={navItems}
          baseAccountPath={baseAccountPath}
          effectiveLang={effectiveLang}
          onSignOut={handleSignOut}
          signingOutLabel={accountMessages.signingOut}
          signOutLabel={accountMessages.signOut}
          greetingLabel={accountMessages.sidebarGreeting}
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
