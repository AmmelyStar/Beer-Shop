// app/api/account/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      console.log("❌ Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params в Next.js 15+
    const { id: rawId } = await context.params;

    console.log("✅ PUT /api/account/reviews/[id] - Review ID:", rawId);
    console.log("✅ User ID:", userId);

    if (!rawId || rawId === "undefined") {
      console.log("❌ Missing review id");
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    const reviewId = Number(rawId);
    if (Number.isNaN(reviewId)) {
      console.log("❌ Invalid review id:", rawId);
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const body = await req.json();
    const { rating, comment } = body;

    console.log("📝 Update data:", { rating, commentLength: comment?.length });

    const parsedRating = Number(rating);

    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      console.log("❌ Invalid rating:", rating);
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 10) {
      console.log("❌ Invalid comment:", comment?.length);
      return NextResponse.json(
        { error: "Comment must be at least 10 characters long" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    console.log("🔄 Updating review in Supabase...");

    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating: parsedRating,
        comment: comment.trim(),
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
      console.log("❌ No review found or not authorized");
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("✅ Review updated successfully:", data.id);

    return NextResponse.json({ review: data });
  } catch (err: unknown) {
    console.error("❌ Review update error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;

    console.log("🗑️ DELETE /api/account/reviews/[id] - Review ID:", rawId);

    if (!rawId || rawId === "undefined") {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    const reviewId = Number(rawId);
    if (Number.isNaN(reviewId)) {
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

    console.log("✅ Review deleted successfully");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ Review delete error:", err);
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
