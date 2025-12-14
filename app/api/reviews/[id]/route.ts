import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

async function assertOwner(id: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, clerk_user_id")
    .eq("id", id)
    .single();

  if (error || !data) return { ok: false, status: 404 as const, error: "Review not found" };
  if (data.clerk_user_id !== userId) return { ok: false, status: 403 as const, error: "Forbidden" };
  return { ok: true as const };
}

// PATCH /api/reviews/:id  -> редактировать (только владелец)
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = ctx.params.id;
  const body = await req.json();

  const rating = body.rating as number | undefined;
  const text = body.text as string | undefined;
  const name = body.name as string | undefined;

  const own = await assertOwner(id, userId);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });

  const patch: Record<string, unknown> = { is_published: false }; // снова на модерацию
  if (typeof rating === "number") patch.rating = rating;
  if (typeof text === "string") patch.text = text;
  if (typeof name === "string") patch.name = name;

  const { error } = await supabaseAdmin.from("reviews").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: "Отзыв обновлён и отправлен на модерацию." });
}

// DELETE /api/reviews/:id -> удалить (только владелец)
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const id = ctx.params.id;

  const own = await assertOwner(id, userId);
  if (!own.ok) return NextResponse.json({ ok: false, error: own.error }, { status: own.status });

  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
