// app/api/account/reviews/route.ts
import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "../../../lib/supabase";
import type { Review } from "../../../lib/supabase";
import { fetchProductByShopifyNumericIdFlattened } from "@/app/data/repo";
import type { Locale } from "@/app/lib/locale";

type ImageLike = { url?: string; src?: string };

type ProductImagesUnion =
  | Array<ImageLike>
  | { nodes?: Array<{ url?: string }> }
  | { edges?: Array<{ node?: { url?: string } }> };

type ProductLike = {
  featuredImage?: ImageLike;
  image?: ImageLike;
  images?: ProductImagesUnion;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isImagesNodes(
  value: unknown
): value is { nodes?: Array<{ url?: string }> } {
  return isRecord(value) && "nodes" in value;
}

function isImagesEdges(
  value: unknown
): value is { edges?: Array<{ node?: { url?: string } }> } {
  return isRecord(value) && "edges" in value;
}

function pickProductImageUrl(product: unknown): string | null {
  if (!isRecord(product)) return null;

  const p = product as ProductLike;

  const direct =
    p.featuredImage?.url ??
    p.featuredImage?.src ??
    p.image?.url ??
    p.image?.src ??
    null;

  if (direct) return direct;

  const imgs = p.images;

  if (Array.isArray(imgs)) {
    return imgs[0]?.url ?? imgs[0]?.src ?? null;
  }

  if (isImagesNodes(imgs)) {
    return imgs.nodes?.[0]?.url ?? null;
  }

  if (isImagesEdges(imgs)) {
    return imgs.edges?.[0]?.node?.url ?? null;
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const langParam = (url.searchParams.get("lang") || "en") as Locale;

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
            product_image_url: pickProductImageUrl(product),
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
            product_image_url: null,
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

type PatchBody = {
  reviewId: string;
  rating?: number;
  text?: string;
};

// ✅ отдельный тип для update, НЕ завязан на keyof Review
type ReviewUpdatePatch = {
  rating?: number;
  text?: string;
};

export async function PATCH(req: Request) {
  try {
    const { userId } = await clerkAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PatchBody;

    if (!body?.reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      );
    }

    // ✅ больше нет Partial<Pick<Review, ...>>
    const patch: ReviewUpdatePatch = {};

    if (typeof body.rating === "number" && Number.isFinite(body.rating)) {
      patch.rating = body.rating;
    }
    if (typeof body.text === "string") {
      patch.text = body.text;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .update(patch)
      .eq("id", body.reviewId)
      .eq("clerk_user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error (update review):", error);
      return NextResponse.json(
        { error: error.message ?? "Failed to update review" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Not found or not allowed" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, review: data });
  } catch (err: unknown) {
    console.error("❌ Error updating review:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await clerkAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const reviewId = url.searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("clerk_user_id", userId)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error (delete review):", error);
      return NextResponse.json(
        { error: error.message ?? "Failed to delete review" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Not found or not allowed" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: unknown) {
    console.error("❌ Error deleting review:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
