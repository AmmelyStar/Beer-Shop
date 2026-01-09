import { Suspense } from "react";
import ShopClient from "../shop/ShopClient";

function ShopFallback() {
  return <div className="p-6">Loading shop…</div>;
}

export default function Page({ params }: { params: { lang: string } }) {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopClient lang={params.lang} />
    </Suspense>
  );
}
