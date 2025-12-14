"use client";

import { useMemo, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import LeaveReviewModal, { type LeaveReviewModalText } from "./LeaveReviewModal";
import type { Locale } from "@/app/lib/locale";

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

type RatingCount = {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
};

type FeaturedReview = {
  id: string | number;
  rating: number;
  content: string;
  author: string;
};

export type ReviewsData = {
  average: number;
  totalCount: number;
  counts: RatingCount[];
  featured: FeaturedReview[];
};

type CustomerReviewsProps = {
  lang: Locale;
  title: string;
  stars: string;
  base1: string;
  base2: string;
  starRew: string;
  CTATitle: string;
  CTASubtitle: string;
  button: string;
  recentReviews: string;
  reviews?: ReviewsData | null;
  productExternalId: string; // Shopify numeric id
  loginToReview: string;
  modalTexts: LeaveReviewModalText;
};

const DEFAULT_REVIEWS: ReviewsData = {
  average: 0,
  totalCount: 0,
  counts: [
    { rating: 5, count: 0 },
    { rating: 4, count: 0 },
    { rating: 3, count: 0 },
    { rating: 2, count: 0 },
    { rating: 1, count: 0 },
  ],
  featured: [],
};

export default function CustomerReviews({
  lang,
  title,
  stars,
  base1,
  base2,
  starRew,
  CTATitle,
  CTASubtitle,
  button,
  recentReviews,
  reviews,
  productExternalId,
  loginToReview,
  modalTexts,
}: CustomerReviewsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const safeReviews = useMemo<ReviewsData>(() => {
    const r = reviews ?? DEFAULT_REVIEWS;
    return {
      average: Number.isFinite(r.average) ? r.average : 0,
      totalCount: Number.isFinite(r.totalCount) ? r.totalCount : 0,
      counts:
        Array.isArray(r.counts) && r.counts.length > 0
          ? r.counts
          : DEFAULT_REVIEWS.counts,
      featured: Array.isArray(r.featured) ? r.featured : [],
    };
  }, [reviews]);

  const writeReviewLabel =
    button && button.trim().length > 0 ? button : "Написать отзыв";

  const canReview = Boolean(productExternalId && productExternalId.trim().length > 0);

  const handleSignInClick = () => {
    router.push(`/${lang}/account`);
  };

  const openModalSafely = () => {
    if (!canReview) return;
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="border-t border-gray-400 pt-12 mx-auto max-w-2xl lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8">
        {/* left */}
        <div className="lg:col-span-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>

          <div className="mt-3 flex items-center">
            <div>
              <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((r) => (
                  <StarIcon
                    key={r}
                    aria-hidden="true"
                    className={classNames(
                      safeReviews.average > r ? "text-yellow-400" : "text-gray-500",
                      "size-5 shrink-0"
                    )}
                  />
                ))}
              </div>
              <p className="sr-only">
                {safeReviews.average} out of 5 {stars}
              </p>
            </div>

            <p className="ml-2 text-sm text-gray-400">
              {base1} {safeReviews.totalCount} {base2}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Review data</h3>
            <dl className="space-y-3">
              {safeReviews.counts.map((count) => {
                const percent =
                  safeReviews.totalCount > 0
                    ? Math.round((count.count / safeReviews.totalCount) * 100)
                    : 0;

                return (
                  <div key={count.rating} className="flex items-center text-sm">
                    <dt className="flex flex-1 items-center">
                      <p className="w-3 font-medium text-white">
                        {count.rating}
                        <span className="sr-only"> {starRew}</span>
                      </p>

                      <div aria-hidden="true" className="ml-1 flex flex-1 items-center">
                        <StarIcon
                          aria-hidden="true"
                          className={classNames(
                            count.count > 0 ? "text-yellow-400" : "text-gray-500",
                            "size-5 shrink-0"
                          )}
                        />

                        <div className="relative ml-3 flex-1">
                          {count.count > 0 ? (
                            <div className="h-3 rounded-full border border-gray-700 bg-gray-800">
                              <div
                                style={{ width: `${percent}%` }}
                                className="h-3 rounded-full border border-yellow-400 bg-yellow-400"
                              />
                            </div>
                          ) : (
                            <div className="h-3 rounded-full border border-gray-700 bg-gray-800 opacity-40" />
                          )}
                        </div>
                      </div>
                    </dt>

                    <dd className="ml-3 w-10 text-right text-sm tabular-nums text-gray-400">
                      {percent}%
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {/* CTA слева */}
          <div className="mt-10">
            <h3 className="text-lg font-medium text-white">{CTATitle}</h3>
            <p className="mt-1 text-sm text-gray-400">{CTASubtitle}</p>

            <SignedOut>
              <button
                onClick={handleSignInClick}
                className="mt-6 relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 w-full"
              >
                {loginToReview}
              </button>
            </SignedOut>

            <SignedIn>
              <button
                onClick={openModalSafely}
                disabled={!canReview}
                className={classNames(
                  "mt-6 relative flex items-center justify-center rounded-md border px-8 py-2 text-sm font-medium w-full focus:outline-none focus:ring-2",
                  canReview
                    ? "border-white/10 bg-yellow-400/20 text-white hover:bg-yellow-400/30 focus:ring-yellow-400/40"
                    : "border-white/10 bg-white/5 text-gray-400 cursor-not-allowed opacity-60"
                )}
              >
                {writeReviewLabel}
              </button>

              {!canReview ? (
                <p className="mt-2 text-xs text-red-300">
                  Product ID is missing — reviews are temporarily unavailable.
                </p>
              ) : null}
            </SignedIn>
          </div>
        </div>

        {/* right */}
        <div className="mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">{recentReviews}</h3>

            <SignedOut>
              <button
                onClick={handleSignInClick}
                className="rounded-md border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                {loginToReview}
              </button>
            </SignedOut>

            <SignedIn>
              <button
                onClick={openModalSafely}
                disabled={!canReview}
                className={classNames(
                  "rounded-md border px-4 py-2 text-sm font-medium",
                  canReview
                    ? "border-white/10 bg-yellow-400/20 text-white hover:bg-yellow-400/30"
                    : "border-white/10 bg-white/5 text-gray-400 cursor-not-allowed opacity-60"
                )}
              >
                {writeReviewLabel}
              </button>
            </SignedIn>
          </div>

          <div className="mt-6 flow-root">
            <div className="-my-12 divide-y divide-gray-700">
              {safeReviews.featured.length === 0 ? (
                <div className="py-10 text-sm text-gray-400">
                  Пока нет отзывов. Будь первым 😉
                </div>
              ) : (
                safeReviews.featured.map((review) => (
                  <div key={review.id} className="py-12">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[0, 1, 2, 3, 4].map((r) => (
                          <StarIcon
                            key={r}
                            aria-hidden="true"
                            className={classNames(
                              review.rating > r ? "text-yellow-400" : "text-gray-500",
                              "size-5 shrink-0"
                            )}
                          />
                        ))}
                      </div>
                      <p className="sr-only">{review.rating} out of 5 stars</p>
                    </div>

                    <div className="mt-4 space-y-6 text-base/7 text-gray-300">
                      {review.content}
                    </div>

                    <h4 className="mt-3 font-bold text-white w-full text-right pr-6">
                      {review.author}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {canReview ? (
        <LeaveReviewModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productExternalId={productExternalId}
          texts={modalTexts}
        />
      ) : null}
    </div>
  );
}
