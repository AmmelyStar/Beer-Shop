// app/components/EditReviewModal.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { useUser } from "@clerk/nextjs";
import type { LeaveReviewModalText } from "../components/LeaveReviewModal";
import type { Review } from "../lib/supabase";

function classNames(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

// import type { Review } from "@/app/lib/supabase";

export type EditableReview = Review & {
  product_title?: string | null;
  product_handle?: string | null;
};

type EditReviewModalProps = {
  open: boolean;
  onClose: () => void;
  review: EditableReview | null;
  texts: LeaveReviewModalText;
  onUpdated?: (updated: EditableReview) => void;
};

export default function EditReviewModal({
  open,
  onClose,
  review,
  texts,
  onUpdated,
}: EditReviewModalProps) {
  const { user, isLoaded } = useUser();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // когда открываем модалку — заполняем полями отзыва
  useEffect(() => {
    if (open && review) {
      console.log("🔍 EditReviewModal opened with review:", {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        product_title: review.product_title,
        product_handle: review.product_handle,
      });

      setRating(review.rating);
      setBody(review.comment);
      setHoverRating(null);
      setError(null);
      setSuccess(null);
    }
  }, [open, review]);

  if (!open || !review) return null;

  const name =
    user?.fullName ||
    (user?.firstName &&
      user.firstName + (user.lastName ? ` ${user.lastName}` : "")) ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isLoaded || !user) {
      setError(texts.mustLogin || "You must be logged in");
      return;
    }

    if (!email) {
      setError(texts.noEmail || "Email is required");
      return;
    }

    if (!rating || !body.trim()) {
      setError(texts.fillRequired || "Please fill all required fields");
      return;
    }

    if (body.trim().length < 10) {
      setError("Comment must be at least 10 characters long");
      return;
    }

    console.log("🚀 Submitting review update:", {
      reviewId: review.id,
      rating,
      commentLength: body.trim().length,
    });

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/account/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: body.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("📥 API Response:", {
        status: res.status,
        ok: res.ok,
        data,
      });

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to update review (${res.status})`
        );
      }

      // ⬇️ ВАЖНО: не теряем product_title / product_handle
      const updated: EditableReview = {
        ...review, // тут старые product_title / product_handle
        ...(data.review ?? {}), // тут новые rating, comment, status
      };

      setSuccess(texts.success || "Review updated successfully!");

      if (onUpdated) {
        onUpdated(updated);
      }

      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error("❌ Error updating review:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update review";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {texts.title || "Edit Review"}
            </h3>
            {review.product_title && (
              <p className="mt-1 text-sm text-gray-400">
                {review.product_title}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!isLoaded ? (
          <p className="mt-10 text-sm text-gray-300">
            {texts.loading || "Loading..."}
          </p>
        ) : !user ? (
          <p className="mt-4 text-sm text-red-400">
            {texts.mustLogin || "You must be logged in"}
          </p>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-400">
                {texts.ratingLabel || "Rating"}
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = hoverRating
                    ? star <= hoverRating
                    : star <= rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <StarIcon
                        className={classNames(
                          active ? "text-yellow-400" : "text-gray-500",
                          "size-6 transition-colors"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User info (readonly) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-400">
                  {texts.nameLabel || "Name"}
                </span>
                <p className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white">
                  {name || "User"}
                </p>
              </div>
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-400">
                  {texts.emailLabel || "Email"}
                </span>
                <p className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white">
                  {email}
                </p>
              </div>
            </div>

            {/* Comment text */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                {texts.reviewLabel || "Your Review"}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-4 text-white outline-none focus:border-white/40 text-base/7 transition-colors placeholder:text-gray-600"
                required
                minLength={10}
                placeholder="Write your review here..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {body.length} characters (minimum 10)
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting || body.trim().length < 10}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-base font-semibold text-gray-900 duration-300 hover:border-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {isSubmitting
                  ? texts.submittingLabel || "Saving..."
                  : texts.submitLabel || "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md border border-white/25 px-6 py-2 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60 transition-colors"
                disabled={isSubmitting}
              >
                {texts.cancelLabel || "Cancel"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
