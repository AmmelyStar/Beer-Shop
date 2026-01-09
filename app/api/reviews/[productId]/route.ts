// app/api/reviews/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import type { ReviewsData } from "@/app/components/CustomerReviews";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

type DbReviewRow = {
  id: string | number;
  rating: number;
  user_name: string | null;
  comment: string | null;
};

function emptyReviewsData(): ReviewsData {
  return {
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
}

function clampRating(n: number): 1 | 2 | 3 | 4 | 5 | null {
  if (!Number.isFinite(n)) return null;
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;

    if (!productId || productId === "undefined") {
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Получаем все одобренные отзывы для продукта
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("shopify_product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    const reviews = (data ?? []) as DbReviewRow[];

    // Если нет отзывов, возвращаем пустые данные
    if (reviews.length === 0) {
      return NextResponse.json(emptyReviewsData());
    }

    // Нормализуем рейтинги (на всякий случай)
    const ratings: Array<1 | 2 | 3 | 4 | 5> = reviews
      .map((r) => clampRating(Number(r.rating)))
      .filter((r): r is 1 | 2 | 3 | 4 | 5 => r !== null);

    const totalCount = ratings.length;

    if (totalCount === 0) {
      return NextResponse.json(emptyReviewsData());
    }

    const sumRating = ratings.reduce((sum, r) => sum + r, 0);
    const average = sumRating / totalCount;

    // Подсчёт количества отзывов по рейтингу (без O(n^2))
    const counter: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const r of ratings) counter[r] += 1;

    const counts = [5, 4, 3, 2, 1].map((rating) => ({
      rating: rating as 1 | 2 | 3 | 4 | 5,
      count: counter[rating as 1 | 2 | 3 | 4 | 5],
    }));

    // Featured отзывы (первые 10)
    const featured = reviews.slice(0, 10).map((r) => ({
      id: r.id,
      rating: clampRating(Number(r.rating)) ?? 5,
      author: r.user_name ?? "",
      content: r.comment ?? "",
    }));

    const responseData: ReviewsData = {
      average: Math.round(average * 10) / 10, // 1 знак после запятой
      totalCount,
      counts,
      featured,
    };

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    console.error("❌ Error fetching reviews:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
