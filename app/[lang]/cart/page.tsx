// app\[lang]\cart\page.tsx

import ShoppingCardOverviews from "@/app/components/ShoppingCardOverviews";
import { getMessages, Locale } from "../messages";

export default async function CartPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const t = await getMessages(lang);

  return (
    <>
      <ShoppingCardOverviews
        lang={lang}
        shoppingCart={t.ShoppingCardOverviews.shoppingCart}
        description={t.ShoppingCardOverviews.description}
        orderSummary={t.ShoppingCardOverviews.orderSummary}
        subtotal={t.ShoppingCardOverviews.subtotal}
        shippingEstimate={t.ShoppingCardOverviews.shippingEstimate}
        taxEstimate={t.ShoppingCardOverviews.taxEstimate}
        shippingEstimateInfo={t.ShoppingCardOverviews.shippingEstimateInfo}
        total={t.ShoppingCardOverviews.total}
        taxEstimateInfo={t.ShoppingCardOverviews.taxEstimateInfo}
        checkout={t.ShoppingCardOverviews.checkout}
        empty={t.ShoppingCardOverviews.empty}
        emptyDescription={t.ShoppingCardOverviews.emptyDescription}
        CTAAdd={t.ShoppingCardOverviews.CTAAdd}
      />
    </>
  );
}
