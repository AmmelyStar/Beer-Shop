// app/api/reviews/submit/route.ts

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_TOKEN = process.env.JUDGEME_PRIVATE_API_TOKEN;
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN;

export const dynamic = "force-dynamic";

type SubmitBody = {
  productHandle?: string;
  rating?: number;
  text?: string;
  name?: string;
};

type JudgeMeResponse = {
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export async function POST(req: Request) {
  if (!API_TOKEN || !SHOP_DOMAIN) {
    console.error("Judge.me token or shop domain is missing");
    return NextResponse.json(
      { ok: false, error: "Judge.me is not configured on the server" },
      { status: 500 }
    );
  }

  const { userId } = await auth();
  const user = await currentUser();

  // 🔐 Только залогиненный пользователь может оставить отзыв
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "You must be logged in to leave a review" },
      { status: 401 }
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress;

  // 🔴 Жёстко проверяем e-mail, без него даже не дергаем Judge.me
  if (!email) {
    console.error("Cannot submit review: user has no primary email");
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email is required to submit a review. Please add an email address to your account.",
      },
      { status: 400 }
    );
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { productHandle, rating, text, name } = body;

  if (!productHandle || !rating || !text) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const trimmed = text.trim();

  if (trimmed.length < 10 || trimmed.length > 200) {
    return NextResponse.json(
      { ok: false, error: "Review text must be between 10 and 200 characters" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { ok: false, error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  try {
    const url = "https://judge.me/api/v1/reviews";

    const form = new URLSearchParams();
    form.set("shop_domain", SHOP_DOMAIN);
    form.set("api_token", API_TOKEN);
    form.set("product_handle", productHandle);
    form.set("rating", String(rating));
    form.set("body", trimmed);

    // 🔵 Email всегда есть и всегда отправляется
    form.set("reviewer_email", email);
    form.set("email", email);
    if (name) form.set("reviewer_name", name);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const rawText = await res.text();

    let judgeData: JudgeMeResponse | null = null;
    try {
      judgeData = rawText ? (JSON.parse(rawText) as JudgeMeResponse) : null;
    } catch {
      // Тело не JSON — может быть HTML-страница. Не страшно, просто логируем.
      console.error("Judge.me non-JSON response:", rawText);
    }

    if (!res.ok) {
      const apiError =
        judgeData?.error ||
        judgeData?.message ||
        rawText ||
        "Failed to submit review to Judge.me";

      console.error(
        "Judge.me create review error:",
        res.status,
        apiError
      );

      // ⚠️ ВАЖНО: возвращаем 200, но ok: false, чтобы фронт не падал, а показал ошибку.
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          error: apiError,
          raw: rawText,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: res.status,
        judgeMe: judgeData,
        raw: rawText,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error submitting review to Judge.me:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
