// app/api/account/reviews/route.ts
import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "../../../lib/supabase";
import type { Review } from "../../../lib/supabase";
import { fetchProductByShopifyNumericIdFlattened } from "@/app/data/repo";
import type { Locale } from "@/app/lib/locale";

export async function GET(req: Request) {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const langParam = (url.searchParams.get("lang") || "en") as Locale;
    console.log("ENV CHECK", {
  url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  srk: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error (account reviews):", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    const reviews = (data ?? []) as Review[];

    // Обогащаем отзывы данными о продукте по shopify_product_id
    const enriched = await Promise.all(
      reviews.map(async (review) => {
        try {
          const product = await fetchProductByShopifyNumericIdFlattened(
            review.shopify_product_id,
            langParam
          );

          return {
            ...review,
            product_handle: product?.handle ?? null,
            product_title: product?.title ?? null,
          };
        } catch (e) {
          console.error(
            "Failed to fetch product for review",
            review.shopify_product_id,
            e
          );
          return {
            ...review,
            product_handle: null,
            product_title: null,
          };
        }
      })
    );

    return NextResponse.json({ reviews: enriched });
  } catch (err: unknown) {
    console.error("❌ Error fetching account reviews:", err);

    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
