"use client";

import { useMemo, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import LeaveReviewModal, { type LeaveReviewModalText } from "./LeaveReviewModal";
import type { Locale } from "@/app/lib/locale";

function classNames(...classes: (string | undefined | null | false)[]) {
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
  createdAt?: string | null;
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

  /** ✅ из messages.customerReviews.recentReviewsLabel */
  recentReviewsLabel: string;
  /** ✅ из messages.customerReviews.emptyReviewsText */
  emptyReviewsText: string;

  reviews?: ReviewsData | null;

  productExternalId: string;
  productHandle: string;

  loginToReview: string;
  modalTexts: LeaveReviewModalText;
};

const EMPTY_REVIEWS: ReviewsData = {
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

function formatDate(dateIso: string, lang: Locale) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "";

  const localeMap: Record<Locale, string> = {
    en: "en-CH",
    ru: "ru-RU",
    uk: "uk-UA",
    et: "et-EE",
    fi: "fi-FI",
  };

  return new Intl.DateTimeFormat(localeMap[lang], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

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
  recentReviewsLabel,
  emptyReviewsText,
  reviews,
  productExternalId,
  productHandle,
  loginToReview,
  modalTexts,
}: CustomerReviewsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const data = useMemo<ReviewsData>(() => {
    if (!reviews) return EMPTY_REVIEWS;

    return {
      average: Number.isFinite(reviews.average) ? reviews.average : 0,
      totalCount: Number.isFinite(reviews.totalCount) ? reviews.totalCount : 0,
      counts: reviews.counts?.length ? reviews.counts : EMPTY_REVIEWS.counts,
      featured: Array.isArray(reviews.featured) ? reviews.featured : [],
    };
  }, [reviews]);

  return (
    <section className="mx-auto max-w-4xl border-t border-gray-400 pt-12">
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>

      {/* ⭐ Average rating */}
      <div className="mt-3 flex items-center">
        <div className="flex items-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <StarIcon
              key={i}
              className={classNames(
                data.average > i ? "text-yellow-400" : "text-gray-500",
                "size-5"
              )}
            />
          ))}
        </div>

        <p className="ml-2 text-sm text-gray-400">
          {base1} {data.totalCount} {base2}
        </p>
      </div>

      {/* ⭐ Breakdown */}
      <dl className="mt-6 space-y-3">
        {data.counts.map((row) => {
          const percent =
            data.totalCount > 0
              ? Math.round((row.count / data.totalCount) * 100)
              : 0;

          return (
            <div key={row.rating} className="flex items-center text-sm">
              <dt className="flex flex-1 items-center">
                <span className="w-3 text-white">
                  {row.rating}
                  <span className="sr-only"> {starRew}</span>
                </span>

                <StarIcon className="ml-1 size-4 text-gray-400" />

                <div className="ml-3 flex-1">
                  <div className="h-3 rounded-full bg-gray-800">
                    <div
                      className="h-3 rounded-full bg-yellow-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </dt>

              <dd className="ml-3 w-10 text-right text-gray-400">{percent}%</dd>
            </div>
          );
        })}
      </dl>

      {/* CTA */}
      <div className="mt-10">
        <h3 className="text-lg font-medium text-white">{CTATitle}</h3>
        <p className="mt-1 text-sm text-gray-400">{CTASubtitle}</p>

        <SignedOut>
          <button
            onClick={() => router.push(`/${lang}/account`)}
            className="mt-6 w-full rounded-md border border-white/10 bg-white/10 px-6 py-2 text-white hover:bg-white/20"
          >
            {loginToReview}
          </button>
        </SignedOut>

        <SignedIn>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 w-full rounded-md border border-yellow-400/40 bg-yellow-400/20 px-6 py-2 text-white hover:bg-yellow-400/30"
          >
            {button}
          </button>
        </SignedIn>
      </div>

      {/* ✅ Reviews list */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-white">{recentReviewsLabel}</h3>

        {data.featured.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">{emptyReviewsText}</p>
        ) : (
          <div className="mt-6 space-y-8 border-t border-gray-700 pt-6">
            {data.featured.map((r) => {
              const dateLabel =
                r.createdAt && r.createdAt.trim().length > 0
                  ? formatDate(r.createdAt, lang)
                  : "";

              return (
                <article key={r.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-gray-400">{dateLabel}</div>
                    <div className="text-sm font-semibold text-white">
                      {r.author}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <StarIcon
                        key={i}
                        className={classNames(
                          r.rating > i ? "text-yellow-400" : "text-gray-600",
                          "size-5"
                        )}
                      />
                    ))}
                    <span className="sr-only">
                      {r.rating} out of 5 {stars}
                    </span>
                  </div>

                  <p className="whitespace-pre-line text-base text-gray-200">
                    {r.content}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <LeaveReviewModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productExternalId={productExternalId}
        productHandle={productHandle}
        texts={modalTexts}
      />
    </section>
  );
}
