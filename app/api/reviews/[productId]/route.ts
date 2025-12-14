// app/api/reviews/[productId]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";
import type { ReviewsData } from "@/app/components/CustomerReviews";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    // Получаем все одобренные отзывы для продукта
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("shopify_product_id", params.productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Если нет отзывов, возвращаем пустые данные
    if (!reviews || reviews.length === 0) {
      const emptyData: ReviewsData = {
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
      return NextResponse.json(emptyData);
    }

    // Вычисляем статистику
    const totalCount = reviews.length;
    const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalCount > 0 ? sumRating / totalCount : 0;

    // Подсчитываем количество отзывов по рейтингу
    const counts = [5, 4, 3, 2, 1].map((rating) => ({
      rating: rating as 1 | 2 | 3 | 4 | 5,
      count: reviews.filter((r) => r.rating === rating).length,
    }));

    // Featured отзывы (первые 10)
    const featured = reviews.slice(0, 10).map((r) => ({
      id: r.id,
      rating: r.rating,
      author: r.user_name,
      content: r.comment,
    }));

    const responseData: ReviewsData = {
      average: Math.round(average * 10) / 10, // Округляем до 1 знака
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
