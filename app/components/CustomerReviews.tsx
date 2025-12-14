// app/components/CustomerReviews.tsx

"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { useUser } from "@clerk/nextjs";
import ReviewModal from "./ReviewModal";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type Review = {
  id: number;
  rating: number;
  body: string;
  reviewer: { name: string };
  pictures?: { id: number; url: string }[];
};

type ReviewsApiResponse = {
  reviews?: Review[];
  stats?: {
    average_rating?: number;
    reviews_count?: number;
  };
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
  button: string; // текст кнопки "Оставить отзыв"
  recentReviews: string;
};

export default function CustomerReviews({
  productHandle,
  title,
  stars,
  base1,
  base2,
  starRew, // пока не используется, но оставляем в пропсах
  CTATitle,
  CTASubtitle,
  button,
  recentReviews,
}: CustomerReviewsProps) {
  const { user } = useUser();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);

        const res = await fetch(`/api/reviews/${productHandle}`);

        if (!res.ok) {
          console.error("Failed to load reviews", res.status);
          setLoading(false);
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          console.error(
            "Non-JSON response from /api/reviews:",
            text.slice(0, 300)
          );
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ReviewsApiResponse;

        setReviews(data.reviews ?? []);
        setAverage(data.stats?.average_rating ?? 0);
        setTotal(data.stats?.reviews_count ?? 0);
      } catch (err) {
        console.error("Reviews fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (productHandle) {
      loadReviews();
    }
  }, [productHandle]);

  const defaultName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "";

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
                {[0, 1, 2, 3, 4].map((rating) => (
                  <StarIcon
                    key={rating}
                    aria-hidden="true"
                    className={classNames(
                      average > rating ? "text-yellow-400" : "text-gray-600",
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

          {/* CTA LEFT BLOCK */}
          <div className="mt-10">
            <h3 className="text-lg font-medium text-gray-200">{CTATitle}</h3>
            <p className="mt-6 text-sm text-gray-300">{CTASubtitle}</p>

            {/* КНОПКА ОТКРЫТИЯ МОДАЛКИ */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-10 relative flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {button}
            </button>
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
                {reviews.map((review) => (
                  <div key={review.id} className="py-12">
                    {/* REVIEW HEADER */}
                    <div className="flex items-center">
                      <div>
                        <h4 className="text-lg text-white font-semibold whitespace-nowrap">
                          {review.reviewer?.name ?? "Anonymous"}
                        </h4>

                        <div className="mt-1 flex items-center">
                          {[0, 1, 2, 3, 4].map((rating) => (
                            <StarIcon
                              key={rating}
                              aria-hidden="true"
                              className={classNames(
                                review.rating > rating
                                  ? "text-yellow-400"
                                  : "text-gray-600",
                                "size-5 shrink-0"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* REVIEW TEXT */}
                    <div className="mt-6 text-pretty text-base text-gray-300">
                      {review.body}
                    </div>

                    {/* REVIEW IMAGES */}
                    {review.pictures && review.pictures.length > 0 && (
                      <div className="mt-4 flex gap-3">
                        {review.pictures.map((img) => (
                          <img
                            key={img.id}
                            src={img.url}
                            className="h-20 w-20 rounded-lg object-cover"
                            alt=""
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* МОДАЛКА ДЛЯ СОЗДАНИЯ ОТЗЫВА */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productHandle={productHandle}
        defaultName={defaultName}
      />
    </div>
  );
}
