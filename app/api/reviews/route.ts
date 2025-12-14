import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/app/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to leave a review" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const rating = Number(body?.rating);
    const shopify_product_id =
      body?.shopify_product_id != null
        ? String(body.shopify_product_id)
        : "";

    // ✅ В БД колонка называется text
    const text = String(body?.comment ?? body?.text ?? "").trim();

    if (!shopify_product_id || !Number.isFinite(rating) || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (text.length < 10) {
      return NextResponse.json(
        { error: "Review text must be at least 10 characters long" },
        { status: 400 }
      );
    }

    const user = await currentUser();

    const email =
      user?.emailAddresses?.[0]?.emailAddress ?? "unknown@example.com";

    // ✅ В БД колонка называется name (NOT NULL)
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      email.split("@")[0] ||
      "Anonymous";

    const supabase = getSupabaseServerClient();

    // ❌ запрет повторных отзывов
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("shopify_product_id", shopify_product_id)
      .eq("clerk_user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // ✅ INSERT строго под схему таблицы
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        shopify_product_id,
        clerk_user_id: userId,
        rating,
        text,        // ✅ NOT NULL
        name,        // ✅ NOT NULL
        user_email: email,
        status: "pending",
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error (insert review):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: data }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Review creation error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
