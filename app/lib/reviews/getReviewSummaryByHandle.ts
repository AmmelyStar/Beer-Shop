import { getSupabaseServerClient } from "@/app/lib/supabase";

export type ReviewSummary = {
  average: number;
  count: number;
};

type ReviewRow = {
  product_handle: string | null;
  rating: number | null;
};

export async function getReviewSummaryByHandle(
  handles: string[]
): Promise<Record<string, ReviewSummary>> {
  const uniqueHandles = Array.from(
    new Set(handles.map((h) => h.trim()).filter(Boolean))
  );

  if (uniqueHandles.length === 0) return {};

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("product_handle, rating")
    .in("product_handle", uniqueHandles)
    .eq("is_published", true);

  if (error || !data) {
    console.error("Supabase error (review summary):", error);
    return {};
  }

  const acc: Record<string, { sum: number; count: number }> = {};

  (data as ReviewRow[]).forEach((row) => {
    if (!row.product_handle || !row.rating) return;

    if (!acc[row.product_handle]) {
      acc[row.product_handle] = { sum: 0, count: 0 };
    }

    acc[row.product_handle].sum += row.rating;
    acc[row.product_handle].count += 1;
  });

  const result: Record<string, ReviewSummary> = {};

  Object.entries(acc).forEach(([handle, v]) => {
    result[handle] = {
      average:
        v.count > 0 ? Math.round((v.sum / v.count) * 10) / 10 : 0,
      count: v.count,
    };
  });

  return result;
}
