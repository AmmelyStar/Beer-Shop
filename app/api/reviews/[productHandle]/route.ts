// app/api/account/reviews/route.ts

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const PRIVATE_API_TOKEN = process.env.JUDGEME_PRIVATE_API_TOKEN;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN;

type AccountReview = {
  id: number;
  title: string;
  body: string;
  rating: number;
  reviewerName: string;
  createdAt: string;
  productTitle: string;
  productHandle: string;
};

type JudgeMeApiReview = {
  id: number;
  title?: string | null;
  body?: string | null;
  rating: number;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
  review_date?: string | null;
  created_at?: string | null;
  product_title?: string | null;
  product_handle?: string | null;
  product?: {
    title?: string | null;
    external_id?: string | null;
    handle?: string | null;
  } | null;
};

type JudgeMeApiResponse = {
  reviews?: JudgeMeApiReview[];
};

// на всякий случай
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!PRIVATE_API_TOKEN || !SHOP_DOMAIN) {
      console.error("Judge.me PRIVATE token or shop domain is missing");
      return NextResponse.json(
        { error: "Judge.me config missing on server", reviews: [] as AccountReview[] },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    const user = await currentUser();

    const email = user?.primaryEmailAddress?.emailAddress;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Not authenticated", reviews: [] as AccountReview[] },
        { status: 401 }
      );
    }

    const url =
      "https://judge.me/api/v1/reviews" +
      `?shop_domain=${encodeURIComponent(SHOP_DOMAIN)}` +
      `&api_token=${encodeURIComponent(PRIVATE_API_TOKEN)}` +
      `&per_page=50` +
      `&reviewer_email=${encodeURIComponent(email)}`;

    const res = await fetch(url, { next: { revalidate: 60 } });

    const rawText = await res.text();
    let raw: JudgeMeApiResponse | null = null;

    try {
      raw = rawText ? (JSON.parse(rawText) as JudgeMeApiResponse) : null;
    } catch {
      console.error("Judge.me account reviews: invalid JSON:", rawText);
      return NextResponse.json(
        {
          error: "Invalid response from Judge.me",
          reviews: [] as AccountReview[],
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error(
        "Judge.me account reviews error:",
        res.status,
        rawText || "<empty>"
      );
      return NextResponse.json(
        {
          error:
            (raw as any)?.error ||
            (rawText || "Failed to load account reviews"),
          reviews: [] as AccountReview[],
        },
        { status: res.status || 500 }
      );
    }

    const reviews: AccountReview[] = (raw?.reviews ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      body: r.body ?? "",
      rating: r.rating,
      reviewerName: r.reviewer_name ?? r.reviewer_email ?? email ?? "Anonymous",
      createdAt: r.review_date ?? r.created_at ?? "",
      productTitle:
        r.product_title ??
        r.product?.title ??
        r.product?.external_id ??
        "",
      productHandle: r.product_handle ?? r.product?.handle ?? "",
    }));

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("Error in /api/account/reviews:", err);
    return NextResponse.json(
      {
        error: "Unexpected server error while loading account reviews",
        reviews: [] as AccountReview[],
      },
      { status: 500 }
    );
  }
}
