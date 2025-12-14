// app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errToMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : JSON.stringify(e);
}

function errToCause(e: unknown): string {
  // В Node/Fetch ошибки часто кладут причину в e.cause
  if (e && typeof e === "object" && "cause" in e) {
    const cause = (e as { cause?: unknown }).cause;
    if (cause instanceof Error) return cause.message;
    if (typeof cause === "string") return cause;
    if (cause) return JSON.stringify(cause);
  }
  return "";
}

// GET /api/reviews?productHandle=xxx  -> только опубликованные
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productHandle = searchParams.get("productHandle");

    if (!productHandle) {
      return NextResponse.json(
        { ok: false, error: "Missing productHandle" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, product_handle, rating, text, name, created_at")
      .eq("product_handle", productHandle)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, reviews: data ?? [] });
  } catch (e: unknown) {
    console.error("GET /api/reviews failed:", e);
    const cause = errToCause(e);
    return NextResponse.json(
      { ok: false, error: errToMessage(e), cause },
      { status: 500 }
    );
  }
}

// POST /api/reviews  -> создать (только залогиненные)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const body: unknown = await req.json();

    // безопасно достаём поля из body без any
    const b = (body ?? {}) as Record<string, unknown>;

    const productHandle =
      typeof b.productHandle === "string" ? b.productHandle : undefined;

    const rating = typeof b.rating === "number" ? b.rating : undefined;

    const text = typeof b.text === "string" ? b.text : undefined;

    const nameFromBody = typeof b.name === "string" ? b.name : undefined;

    const name = (nameFromBody ?? user?.firstName ?? "User").toString();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

    if (!productHandle || rating === undefined || !text) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("reviews").insert({
      product_handle: productHandle,
      rating,
      text,
      name,
      clerk_user_id: userId,
      user_email: email,
      is_published: false,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Спасибо! Отзыв появится после модерации.",
    });
  } catch (e: unknown) {
    console.error("POST /api/reviews failed:", e);
    const cause = errToCause(e);
    return NextResponse.json(
      { ok: false, error: errToMessage(e), cause },
      { status: 500 }
    );
  }
}
