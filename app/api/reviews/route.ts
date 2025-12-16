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
      body?.shopify_product_id != null ? String(body.shopify_product_id) : "";
    const product_handle =
      body?.product_handle != null ? String(body.product_handle) : "";

    // В БД колонка называется text
    const text = String(body?.comment ?? body?.text ?? "").trim();

    if (!product_handle) {
      return NextResponse.json(
        { error: "Missing product_handle" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
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

    // В БД колонка называется name (NOT NULL)
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      email.split("@")[0] ||
      "Anonymous";

    const supabase = getSupabaseServerClient();

    // 1 отзыв на товар от 1 пользователя — по product_handle (надёжно)
    const { data: existing, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_handle", product_handle)
      .eq("clerk_user_id", userId)
      .limit(1);

    if (existingError) {
      console.error("Supabase error (check existing):", existingError);
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_handle, // ✅ ключ для страницы товара
        shopify_product_id: shopify_product_id || null, // опционально
        clerk_user_id: userId,
        rating,
        text, // ✅ NOT NULL
        name, // ✅ NOT NULL
        user_email: email,
        status: "approved",
        is_published: true,
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
