// app/api/reviews/[productHandle]/route.ts

import { NextResponse } from "next/server";

const API_TOKEN = process.env.JUDGEME_PRIVATE_API_TOKEN;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN;

export const dynamic = "force-dynamic";

type JudgeMeReview = {
  id: number;
  title?: string | null;
  body?: string | null;
  rating: number;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  created_at?: string | null;
  review_date?: string | null;
  product_handle?: string | null;
};

type JudgeMeReviewsResponse = {
  reviews?: JudgeMeReview[];
  error?: string;
  message?: string;
  [key: string]: unknown;
};

type PublicReview = {
  id: number;
  rating: number;
  body: string;
  reviewer: { name: string };
  pictures?: { id: number; url: string }[];
};

type Stats = {
  average_rating: number;
  reviews_count: number;
};

export async function GET(
  _req: Request,
  { params }: { params: { productHandle: string } }
) {
  const productHandle = params.productHandle;

  // Если не настроен Judge.me — возвращаем пустой набор, но БЕЗ 400
  if (!API_TOKEN || !SHOP_DOMAIN) {
    console.error("Judge.me token or shop domain is missing");
    const empty: PublicReview[] = [];
    const stats: Stats = { average_rating: 0, reviews_count: 0 };
    return NextResponse.json({ reviews: empty, stats });
  }

  if (!productHandle) {
    const empty: PublicReview[] = [];
    const stats: Stats = { average_rating: 0, reviews_count: 0 };
    return NextResponse.json({ reviews: empty, stats });
  }

  try {
    // Берём просто список отзывов по магазину и фильтруем локально
    const url =
      "https://judge.me/api/v1/reviews" +
      `?shop_domain=${encodeURIComponent(SHOP_DOMAIN)}` +
      `&api_token=${encodeURIComponent(API_TOKEN)}` +
      `&per_page=100` +
      `&published=1`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    const rawText = await res.text();

    let data: JudgeMeReviewsResponse | null = null;
    try {
      data = rawText ? (JSON.parse(rawText) as JudgeMeReviewsResponse) : null;
    } catch {
      console.error("Judge.me product reviews invalid JSON:", rawText);
      const empty: PublicReview[] = [];
      const stats: Stats = { average_rating: 0, reviews_count: 0 };
      return NextResponse.json({ reviews: empty, stats });
    }

    if (!res.ok) {
      const apiError =
        data?.error ||
        data?.message ||
        rawText ||
        "Failed to load reviews from Judge.me";

      console.error(
        "Judge.me product reviews error:",
        res.status,
        apiError
      );

      const empty: PublicReview[] = [];
      const stats: Stats = { average_rating: 0, reviews_count: 0 };
      return NextResponse.json({ reviews: empty, stats });
    }

    // Фильтруем по текущему product_handle
    const allReviews = data?.reviews ?? [];
    const filtered = allReviews.filter(
      (r) => r.product_handle === productHandle
    );

    const reviews: PublicReview[] = filtered.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body ?? "",
      reviewer: {
        name: r.reviewer_name ?? r.reviewer_email ?? "Anonymous",
      },
      // На будущее — если подключишь картинки из Judge.me
      pictures: [],
    }));

    const reviews_count = reviews.length;
    const average_rating =
      reviews_count > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews_count
        : 0;

    const stats: Stats = {
      average_rating,
      reviews_count,
    };

    return NextResponse.json({ reviews, stats });
  } catch (err) {
    console.error("Error loading product reviews from Judge.me:", err);
    const empty: PublicReview[] = [];
    const stats: Stats = { average_rating: 0, reviews_count: 0 };
    return NextResponse.json({ reviews: empty, stats });
  }
}
