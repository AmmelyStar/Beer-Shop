// app/[lang]/shop/page.tsx
import { fetchAllProductsFlattened } from "../../data/repo";
import ShopContent from "@/app/components/ShopContent";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import type { Locale } from "../../lib/locale";
import { getMessages } from "../messages";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const t = await getMessages(lang);

  const allProducts = await fetchAllProductsFlattened(lang);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        lang={lang}
        labels={{
          home: t.common.home,
          shop: t.common.shop,
          categories: t.AllProducts.categories,
        }}
      />
      <ShopContent
        products={allProducts}
        translations={t.AllProducts}
        lang={lang}
      />
    </main>
  );
}

// type ShopPageProps = {
//   params: { lang: Locale };
// };

// export default async function ShopPage({ params: { lang } }: ShopPageProps) {
//   const t = await getMessages(lang);
//   const allProducts = await fetchAllProductsFlattened(lang);

//   return (
//     <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
//       <Breadcrumbs
//         lang={lang}
//         labels={{
//           home: t.common.home,
//           shop: t.common.shop,
//           categories: t.AllProducts.categories,
//         }}
//       />
//       <ShopContent
//         products={allProducts}
//         translations={t.AllProducts}
//         lang={lang}
//       />
//     </main>
//   );
// }
