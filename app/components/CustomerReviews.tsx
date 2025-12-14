// app/components/CustomerReviews.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { useUser, useAuth } from "@clerk/nextjs";
import ReviewModal from "./ReviewModal";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type PublicReview = {
  id: string;
  rating: number;
  text: string;
  name: string | null;
  created_at: string;
};

type MyReview = {
  id: string;
  product_handle: string;
  rating: number;
  text: string;
  name: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type Stats = {
  average: number;
  count: number;
  breakdown: Record<number, number>; // 1..5
};

type CustomerReviewsProps = {
  productHandle: string;
  title: string;
  stars: string;
  base1: string;
  base2: string;
  starRew: string;
  CTATitle: string;
  CTASubtitle: string;
  button: string;
  loginToReview: string;
  recentReviews: string;
};

export default function CustomerReviews({
  productHandle,
  title,
  stars,
  base1,
  base2,
  starRew,
  CTATitle,
  CTASubtitle,
  button,
  loginToReview,
  recentReviews,
}: CustomerReviewsProps) {
  const { user } = useUser();
  const { isSignedIn } = useAuth();

  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [stats, setStats] = useState<Stats>({
    average: 0,
    count: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  const [myReview, setMyReview] = useState<MyReview | null>(null);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // для режима редактирования в модалке
  const [editing, setEditing] = useState<{
    id: string;
    rating: number;
    text: string;
    name: string;
  } | null>(null);

  const defaultName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "";

  const averageRounded = useMemo(() => {
    // для заливки звезд (0..5)
    return Math.round((stats.average || 0) * 10) / 10;
  }, [stats.average]);

  async function loadPublic() {
    const res = await fetch(`/api/reviews?productHandle=${encodeURIComponent(productHandle)}`);
    const json = await res.json();
    if (json.ok) setReviews(json.reviews ?? []);
  }

  async function loadStats() {
    const res = await fetch(`/api/reviews/stars?productHandle=${encodeURIComponent(productHandle)}`);
    const json = await res.json();
    if (json.ok && json.stats) setStats(json.stats);
  }

  async function loadMine() {
    if (!isSignedIn) {
      setMyReview(null);
      return;
    }
    const res = await fetch(`/api/reviews/me`);
    const json = await res.json();
    if (!json.ok) {
      setMyReview(null);
      return;
    }
    const mine: MyReview[] = json.reviews ?? [];
    const found = mine.find((r) => r.product_handle === productHandle) ?? null;
    setMyReview(found);
  }

  async function refreshAll() {
    await Promise.all([loadPublic(), loadStats(), loadMine()]);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!productHandle) return;
      try {
        setLoading(true);
        await refreshAll();
      } catch (e) {
        console.error("Reviews load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productHandle, isSignedIn]);

  const total = stats.count;

  const breakdownRows = useMemo(() => {
    // отображаем 5..1
    const rows = [5, 4, 3, 2, 1].map((s) => {
      const c = stats.breakdown?.[s] ?? 0;
      const pct = total ? Math.round((c / total) * 100) : 0;
      return { stars: s, count: c, pct };
    });
    return rows;
  }, [stats.breakdown, total]);

  const openCreateModal = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!myReview) return;
    setEditing({
      id: myReview.id,
      rating: myReview.rating,
      text: myReview.text,
      name: myReview.name ?? defaultName ?? "",
    });
    setIsModalOpen(true);
  };

  const onDeleteMyReview = async () => {
    if (!myReview) return;

    const res = await fetch(`/api/reviews/${myReview.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.ok) {
      console.error("Delete review failed:", json?.error || res.status);
      return;
    }

    await refreshAll();
  };

  // сюда будет звать ReviewModal после успешного submit/update
  const handleModalSuccess = async () => {
    setIsModalOpen(false);
    setEditing(null);
    await refreshAll();
  };

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-200">
            {title}
          </h2>

          {/* AVG RATING */}
          <div className="mt-3 flex items-center">
            <div>
              <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon
                    key={i}
                    aria-hidden="true"
                    className={classNames(
                      averageRounded > i ? "text-yellow-400" : "text-gray-600",
                      "size-5 shrink-0"
                    )}
                  />
                ))}
              </div>
              <p className="sr-only">{stars}</p>
            </div>

            <p className="ml-2 text-sm text-gray-400">
              {base1} {total} {base2}
            </p>
          </div>

          {/* BREAKDOWN */}
          <div className="mt-6 space-y-2">
            {breakdownRows.map((row) => (
              <div key={row.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm text-gray-300">{row.stars}</span>
                  <StarIcon className="size-4 text-gray-500" aria-hidden="true" />
                </div>

                <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/30"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>

                <div className="w-14 text-right text-sm text-gray-400">
                  {row.count}
                </div>
              </div>
            ))}
            {/* starRew у тебя в i18n — можно использовать как подпись */}
            <p className="pt-2 text-xs text-gray-500">{starRew}</p>
          </div>

          {/* CTA LEFT BLOCK */}
          <div className="mt-10">
            <h3 className="text-lg font-medium text-gray-200">{CTATitle}</h3>
            <p className="mt-6 text-sm text-gray-300">{CTASubtitle}</p>

            {!isSignedIn ? (
              <p className="mt-6 text-sm text-gray-400">{loginToReview}</p>
            ) : (
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {button}
                </button>

                {myReview && (
                  <>
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="relative flex items-center justify-center rounded-md border border-white/10 bg-transparent px-6 py-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={onDeleteMyReview}
                      className="relative flex items-center justify-center rounded-md border border-white/10 bg-transparent px-6 py-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            {myReview && (
              <p className="mt-4 text-xs text-gray-500">
                {myReview.is_published ? "Published" : "Pending moderation"}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — REVIEWS */}
        <div className="mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
          <h3 className="sr-only">{recentReviews}</h3>

          <div className="flow-root">
            {loading ? (
              <p className="text-gray-400">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-400">No reviews yet.</p>
            ) : (
              <div className="-my-12 divide-y divide-gray-800">
                {reviews.map((r) => (
                  <div key={r.id} className="py-12">
                    <div className="flex items-center">
                      <div>
                        <h4 className="text-lg text-white font-semibold whitespace-nowrap">
                          {r.name ?? "Anonymous"}
                        </h4>

                        <div className="mt-1 flex items-center">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <StarIcon
                              key={i}
                              aria-hidden="true"
                              className={classNames(
                                r.rating > i ? "text-yellow-400" : "text-gray-600",
                                "size-5 shrink-0"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-pretty text-base text-gray-300">
                      {r.text}
                    </div>

                    {/* картинки пока убрали: в Supabase схеме их нет */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛКА */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        productHandle={productHandle}
        defaultName={defaultName}
        // новые пропсы для редактирования/refresh
        editing={editing}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
