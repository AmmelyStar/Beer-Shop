import { notFound } from "next/navigation";

import { fetchProductByHandleFlattened } from "../../../data/repo";
import { getMessages } from "../../messages";
import type { Locale } from "../../../lib/locale";

import ProductOverviews from "../../../components/ProductOverviews";
import CustomerReviews, {
  type ReviewsData,
} from "../../../components/CustomerReviews";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import { getSupabaseServerClient } from "@/app/lib/supabase";

function getCategoryFromProduct(
  collections: string[] | undefined,
): string | undefined {
  if (!collections || collections.length === 0) {
    return undefined;
  }

  const lower = collections.map((collection) =>
    collection.toLowerCase(),
  );

  if (
    lower.some(
      (collection) =>
        collection.includes("beer") ||
        collection.includes("пиво"),
    )
  ) {
    return "beer";
  }

  if (
    lower.some(
      (collection) =>
        collection.includes("cider") ||
        collection.includes("сидр"),
    )
  ) {
    return "cider";
  }

  if (
    lower.some(
      (collection) =>
        collection.includes("snack") ||
        collection.includes("снек"),
    )
  ) {
    return "snacks";
  }

  return undefined;
}

function gidToNumericProductId(
  gid: string | null | undefined,
): string {
  if (!gid) {
    return "";
  }

  const match = gid.match(/\/Product\/(\d+)$/);

  return match?.[1] ?? "";
}

type ShopifyProductWithIds = {
  id?: string | null;
  legacyResourceId?: string | number | null;
  title: string;
  handle: string;
  collections?: string[];
};

type ReviewRow = {
  id: string;
  rating: number | null;
  text: string;
  name: string;
  created_at: string;
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    lang: Locale;
    handle: string;
  }>;
}) {
  const { lang, handle } = await params;

  const t = await getMessages(lang);

  const rawProduct =
    await fetchProductByHandleFlattened(handle, lang);

  if (!rawProduct) {
    notFound();
  }

  const product =
    rawProduct as ShopifyProductWithIds;

  const productCategory = getCategoryFromProduct(
    product.collections,
  );

  const productExternalId =
    (product.legacyResourceId != null
      ? String(product.legacyResourceId)
      : "") || gidToNumericProductId(product.id);

  const supabase = getSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, rating, text, name, created_at")
    .eq("product_handle", product.handle)
    .eq("is_published", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.warn("Supabase product reviews error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const list: ReviewRow[] = error
    ? []
    : ((rows ?? []) as ReviewRow[]);

  const totalCount = list.length;

  const sum = list.reduce(
    (total, review) =>
      total + (Number(review.rating) || 0),
    0,
  );

  const average =
    totalCount > 0
      ? Math.round((sum / totalCount) * 10) / 10
      : 0;

  const counts = (
    [5, 4, 3, 2, 1] as const
  ).map((rating) => ({
    rating,
    count: list.filter(
      (review) =>
        Number(review.rating) === rating,
    ).length,
  }));

  const featured = list.map((review) => ({
    id: review.id,
    rating: Number(review.rating) || 0,
    content: review.text,
    author: review.name,
    createdAt: review.created_at,
  }));

  const reviewsData: ReviewsData = {
    average,
    totalCount,
    counts,
    featured,
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
<ProductOverviews
  product={rawProduct}
  perUnit={t.OneProduct.perUnit}
  volume={t.OneProduct.volume}
  size={t.OneProduct.size}
  abv={t.OneProduct.abv}
  ibu={t.OneProduct.ibu}
  fg={t.OneProduct.fg}
  country={t.OneProduct.country}
  brand={t.OneProduct.brand}
  style={t.OneProduct.style}
  packType={t.OneProduct.packType}
  bottlesInBox={t.OneProduct.bottlesInBox}
  shelfLife={t.OneProduct.shelfLife}
  days={t.OneProduct.days}
  noImages={t.OneProduct.noImages}
  missingVariant={t.OneProduct.missingVariant}
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

      <CustomerReviews
        lang={lang}
        title={t.CustomerReviews.title}
        stars={t.CustomerReviews.stars}
        base1={t.CustomerReviews.base1}
        base2={t.CustomerReviews.base2}
        starRew={t.CustomerReviews.starRew}
        CTATitle={t.CustomerReviews.CTATitle}
        CTASubtitle={
          t.CustomerReviews.CTASubtitle
        }
        button={t.CustomerReviews.button}
        recentReviewsLabel={
          t.CustomerReviews.recentReviews
        }
        emptyReviewsText={
          t.CustomerReviews.emptyReviewsText
        }
        reviews={reviewsData}
        productExternalId={productExternalId}
        productHandle={product.handle}
        loginToReview={
          t.CustomerReviews.loginToReview
        }
        modalTexts={t.leaveReviewModal}
      />
    </main>
  );
}