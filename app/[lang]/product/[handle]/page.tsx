import { fetchProductByHandleFlattened } from "../../../data/repo";
import { getMessages } from "../../messages";
import type { Locale } from "../../../lib/locale";
import ProductOverviews from "../../../components/ProductOverviews";
import CustomerReviews, { type ReviewsData } from "../../../components/CustomerReviews";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import { getSupabaseServerClient } from "@/app/lib/supabase";

function getCategoryFromProduct(collections: string[] | undefined): string | undefined {
  if (!collections || collections.length === 0) return undefined;
  const lower = collections.map((c) => c.toLowerCase());
  if (lower.some((c) => c.includes("beer") || c.includes("пиво"))) return "beer";
  if (lower.some((c) => c.includes("cider") || c.includes("сидр"))) return "cider";
  if (lower.some((c) => c.includes("snack") || c.includes("снек"))) return "snacks";
  return undefined;
}

function gidToNumericProductId(gid: string | null | undefined): string {
  if (!gid) return "";
  const m = gid.match(/\/Product\/(\d+)$/);
  return m?.[1] ?? "";
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
  params: Promise<{ lang: Locale; handle: string }>;
}) {
  const { lang, handle } = await params;

  const t = await getMessages(lang);

  const rawProduct = await fetchProductByHandleFlattened(handle, lang);
  if (!rawProduct) notFound();

  const product = rawProduct as ShopifyProductWithIds;
  const productCategory = getCategoryFromProduct(product.collections);

  const productExternalId =
    (product.legacyResourceId != null ? String(product.legacyResourceId) : "") ||
    gidToNumericProductId(product.id);

  const supabase = getSupabaseServerClient();

  // ✅ Подтягиваем отзывы по handle
  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, rating, text, name, created_at")
    .eq("product_handle", product.handle)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) console.error("Supabase error (product reviews):", error);

  const list: ReviewRow[] = (rows ?? []) as ReviewRow[];

  const totalCount = list.length;

  const sum = list.reduce((s, r) => s + (Number(r.rating) || 0), 0);
  const average =
    totalCount > 0 ? Math.round((sum / totalCount) * 10) / 10 : 0;

  const counts = ([5, 4, 3, 2, 1] as const).map((r) => ({
    rating: r,
    count: list.filter((x) => Number(x.rating) === r).length,
  }));

  // ✅ ВАЖНО: прокидываем createdAt, чтобы в UI была дата
  const featured = list.map((r) => ({
    id: r.id,
    rating: Number(r.rating) || 0,
    content: r.text,
    author: r.name,
    createdAt: r.created_at,
  }));

  const reviewsData: ReviewsData = {
    average,
    totalCount,
    counts,
    featured, // показываем все отзывы (можешь ограничить slice(0, N))
  };

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

        // ✅ ВОТ ТУТ FIX: больше не recentReviews, а recentReviewsLabel
        recentReviewsLabel={t.CustomerReviews.recentReviews}
        // optional:
        // emptyReviewsText={t.CustomerReviews.emptyReviews ?? "No reviews yet"}

        reviews={reviewsData}
        productExternalId={productExternalId}
        productHandle={product.handle}
        loginToReview={"Log in to leave a review"}
        modalTexts={leaveReviewModalTexts}
      />
    </main>
  );
}
