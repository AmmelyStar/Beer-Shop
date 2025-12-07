// app/components/SyncShopifyCustomer.tsx
"use client";

import { useEffect } from "react";

type SyncCustomerResponse = {
  success?: boolean;
  shopifyCustomerId?: string;
  error?: string;
};

export default function SyncShopifyCustomer() {
  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch("/api/shopify/sync-customer", {
          method: "POST",
        });

        let bodyText: string | null = null;
        try {
          bodyText = await res.text(); // читаем всегда как текст
        } catch {
          bodyText = null;
        }

        if (!res.ok) {
          console.error(
            "Failed to sync Shopify customer:",
            res.status,
            res.statusText,
            bodyText
          );
          return;
        }

        if (!bodyText) {
          console.error("Empty response from /api/shopify/sync-customer");
          return;
        }

        let data: SyncCustomerResponse;
        try {
          data = JSON.parse(bodyText) as SyncCustomerResponse;
        } catch {
          console.error("Response is not valid JSON:", bodyText);
          return;
        }

        if (data.shopifyCustomerId) {
          console.log("Shopify customer synced:", data.shopifyCustomerId);
        } else {
          console.log("Sync response without customerId:", data);
        }
      } catch (e) {
        console.error("Sync Shopify customer error", e);
      }
    };

    void sync();
  }, []);

  return null;
}
