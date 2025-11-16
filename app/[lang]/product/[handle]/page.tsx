// app/[lang]/product/[handle]/page.tsx
import { fetchProductByHandleFlattened } from "../../../data/repo";
import { getMessages } from "../../messages";
import type { Locale } from "../../../lib/locale";
import ProductOverviews from "../../../components/ProductOverviews";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";

// Функция для определения категории из коллекций
function getCategoryFromProduct(
  collections: string[] | undefined
): string | undefined {
  if (!collections || collections.length === 0) return undefined;

  const lowerCollections = collections.map((c) => c.toLowerCase());

  if (lowerCollections.some((c) => c.includes("beer") || c.includes("пиво")))
    return "beer";
  if (lowerCollections.some((c) => c.includes("cider") || c.includes("сидр")))
    return "cider";
  if (lowerCollections.some((c) => c.includes("snack") || c.includes("снек")))
    return "snacks";

  return undefined;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: Locale; handle: string }>;
}) {
  const { lang, handle } = await params;

  const t = await getMessages(lang);
  const product = await fetchProductByHandleFlattened(handle, lang);

  if (!product) {
    notFound();
  }

  const productCategory = getCategoryFromProduct(product.collections);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        lang={lang}
        labels={{
          home: t.common.home,
          shop: t.common.shop,
          categories: t.AllProducts.categories,
        }}
        productCategory={productCategory}
        currentLabel={product.title}
      />
      <ProductOverviews
        product={product}
        perUnit={t.OneProduct.perUnit}
        abv={t.OneProduct.abv}
        ibu={t.OneProduct.ibu}
        fg={t.OneProduct.fg}
        country={t.OneProduct.country}
        brand={t.OneProduct.brand}
        style={t.OneProduct.style}
        addToCart={t.OneProduct.addToCart}
        reviews={t.OneProduct.reviews}
        outOf5Stars={t.OneProduct.outOf5Stars}
        viewAllReviews={t.OneProduct.viewAllReviews}
        leaveAReview={t.OneProduct.leaveAReview}
        description={t.OneProduct.description}
        tastedBestWith={t.OneProduct.tastedBestWith}
        allergens={t.OneProduct.allergens}
        ingredients={t.OneProduct.ingredients}
      />
    </main>
  );
}

/* <CustomerReviews
        title={t.CustomerReviews.title}
        stars={t.CustomerReviews.stars}
        base1={t.CustomerReviews.base1}
        base2={t.CustomerReviews.base2}
        starRew={t.CustomerReviews.starRew}
        CTATitle={t.CustomerReviews.CTATitle}
        CTASubtitle={t.CustomerReviews.CTASubtitle}
        button={t.CustomerReviews.button}
        recentReviews={t.CustomerReviews.recentReviews}
      /> */
