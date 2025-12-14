import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase/server";

type ReviewRatingRow = {
  rating: number;
};

export async function GET(req: Request) {
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
    .select("rating")
    .eq("product_handle", productHandle)
    .eq("is_published", true);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const ratings = ((data ?? []) as ReviewRatingRow[]).map(r => r.rating);

  const count = ratings.length;
  const avg = count ? ratings.reduce((a, b) => a + b, 0) / count : 0;

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) breakdown[r]++;

  return NextResponse.json({
    ok: true,
    stats: {
      average: Math.round(avg * 10) / 10,
      count,
      breakdown
    }
  });
}
