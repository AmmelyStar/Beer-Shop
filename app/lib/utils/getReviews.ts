// app/lib/getReviews.ts
import "server-only";
import { getSupabaseServerClient } from "../supabase";
import type { ReviewsData } from "@/app/components/CustomerReviews";

const EMPTY_REVIEWS: ReviewsData = {
  average: 0,
  totalCount: 0,
  counts: [
    { rating: 5, count: 0 },
    { rating: 4, count: 0 },
    { rating: 3, count: 0 },
    { rating: 2, count: 0 },
    { rating: 1, count: 0 },
  ],
  featured: [],
};

export async function getReviews(
  shopifyProductId: string
): Promise<ReviewsData> {
  try {
    console.log("🔍 Fetching reviews for product:", shopifyProductId);
    console.log("📝 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("🔑 Has service key:", !!process.env.SUPABASE_SERVICE_KEY);

    const supabase = getSupabaseServerClient();

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("shopify_product_id", shopifyProductId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error fetching reviews:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return EMPTY_REVIEWS;
    }

    if (!reviews || reviews.length === 0) {
      console.log("No reviews found for product:", shopifyProductId);
      return EMPTY_REVIEWS;
    }

    // Вычисляем статистику
    const totalCount = reviews.length;
    const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalCount > 0 ? sumRating / totalCount : 0;

    const counts = [5, 4, 3, 2, 1].map((rating) => ({
      rating: rating as 1 | 2 | 3 | 4 | 5,
      count: reviews.filter((r) => r.rating === rating).length,
    }));

    const featured = reviews.slice(0, 10).map((r) => ({
      id: r.id,
      rating: r.rating,
      author: r.user_name,
      content: r.comment,
    }));

    console.log(`Found ${totalCount} reviews, average: ${average}`);

    return {
      average: Math.round(average * 10) / 10,
      totalCount,
      counts,
      featured,
    };
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return EMPTY_REVIEWS;
  }
}
