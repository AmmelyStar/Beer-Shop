// app/api/account/reviews/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateReviewBody = {
  rating?: unknown;
  comment?: unknown;
};

function isValidId(rawId: string | undefined | null): rawId is string {
  return typeof rawId === "string" && rawId.length > 0 && rawId !== "undefined";
}

function parseRating(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

function parseComment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 10) return null;
  return trimmed;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;

    if (!isValidId(rawId)) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    const reviewId = Number(rawId);
    if (!Number.isFinite(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const body = (await req.json()) as UpdateReviewBody;

    const rating = parseRating(body.rating);
    if (rating === null) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const comment = parseComment(body.comment);
    if (comment === null) {
      return NextResponse.json(
        { error: "Comment must be at least 10 characters long" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating,
        comment,
        status: "approved",
      })
      .eq("id", reviewId)
      .eq("clerk_user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ review: data });
  } catch (err: unknown) {
    console.error("❌ Review update error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;

    if (!isValidId(rawId)) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    const reviewId = Number(rawId);
    if (!Number.isFinite(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("clerk_user_id", userId);

    if (error) {
      console.error("❌ Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ Review delete error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
