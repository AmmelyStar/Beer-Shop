// app/components/SyncShopifyCustomer.tsx

"use client";

import { useEffect } from "react";

const SYNC_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SHOPIFY_CUSTOMER_SYNC === "true";

export default function SyncShopifyCustomer() {
  useEffect(() => {
    // на этом магазине синк отключён
    if (!SYNC_ENABLED) {
      console.info("Shopify customer sync is disabled for this environment.");
      return;
    }

    const sync = async () => {
      try {
        const res = await fetch("/api/shopify/sync-customer", {
          method: "POST",
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(
            "Failed to sync Shopify customer:",
            res.status,
            text
          );
        } else {
          const data = await res.json();
          console.log("Shopify customer synced:", data);
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    };

    sync();
  }, []);

  // компонент ничего не рендерит
  return null;
}
