// app/[lang]/cart/CartClient.tsx
"use client";

import type { Locale } from "@/app/lib/locale";
import ShoppingCardOverviews from "../../components/ShoppingCardOverviews";

type CartMsgs = {
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
};

type Props = {
  lang: Locale;
  success: boolean;
  cancel: boolean;
  cartMsgs: CartMsgs; // ✅ добавили
};

export default function CartClient({ lang, success, cancel, cartMsgs }: Props) {
  return (
    <section className="mt-6">
      {success ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-200">
          Payment successful.
        </div>
      ) : null}

      {cancel ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-200">
          Payment cancelled.
        </div>
      ) : null}

      <ShoppingCardOverviews {...cartMsgs} lang={lang} />
    </section>
  );
}
