// app/[lang]/product/[handle]/page.tsx
import { fetchProductByHandleFlattened } from "../../../data/repo";
import { getMessages } from "../../messages";
import type { Locale } from "../../../lib/locale";
import ProductOverviews from "../../../components/ProductOverviews";
import CustomerReviews from "../../../components/CustomerReviews";
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

// Shopify product.id обычно: gid://shopify/Product/1234567890
function gidToNumericProductId(gid: string | null | undefined): string {
  if (!gid) return "";
  const m = gid.match(/\/Product\/(\d+)$/);
  return m?.[1] ?? "";
}

// Минимальный тип — чтобы НЕ использовать any и пройти строгий ESLint
type ShopifyProductWithIds = {
  id?: string | null;
  legacyResourceId?: string | number | null;
  title: string;
  handle: string;
  collections?: string[];
};

export default async function ProductPage({
  params,
}: {
  // ✅ В этом проекте params приходит Promise — и Next просит await
  params: Promise<{ lang: Locale; handle: string }>;
}) {
  const { lang, handle } = await params;

  const t = await getMessages(lang);

  const rawProduct = await fetchProductByHandleFlattened(handle, lang);
  if (!rawProduct) notFound();

  const product = rawProduct as ShopifyProductWithIds;

  const productCategory = getCategoryFromProduct(product.collections);

  // ✅ numeric product id для Supabase reviews
  const productExternalId =
    (product.legacyResourceId != null ? String(product.legacyResourceId) : "") ||
    gidToNumericProductId(product.id);

  // ✅ тексты модалки (без зависимости от translations)
  const leaveReviewModalTexts = {
    title: "Leave a review",
    subtitle: "Share your experience with this product",
    ratingLabel: "Rating",
    commentLabel: "Your review",
    commentPlaceholder: "Write your review here...",
    submitButton: "Submit",
    cancelButton: "Cancel",
    submitting: "Submitting...",
    successMessage: "Thanks! Your review was sent.",
    errorMessage: "Something went wrong. Please try again.",
  };

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

      {/* Карточка товара */}
      <ProductOverviews
        product={rawProduct}
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

      {/* Блок отзывов под товаром */}
      <CustomerReviews
        lang={lang}
        title={t.CustomerReviews.title}
        stars={t.CustomerReviews.stars}
        base1={t.CustomerReviews.base1}
        base2={t.CustomerReviews.base2}
        starRew={t.CustomerReviews.starRew}
        CTATitle={t.CustomerReviews.CTATitle}
        CTASubtitle={t.CustomerReviews.CTASubtitle}
        button={t.CustomerReviews.button}
        recentReviews={t.CustomerReviews.recentReviews}
        reviews={null}
        productExternalId={productExternalId}
        loginToReview={"Log in to leave a review"}
        modalTexts={leaveReviewModalTexts}
      />
    </main>
  );
}
