"use client";

import { useMemo, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";

export type LeaveReviewModalText = {
  // leave modal (обязательные)
  title: string;
  subtitle?: string;
  ratingLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  submitButton: string;
  cancelButton: string;
  submitting: string;
  successMessage: string;
  errorMessage: string;

  // edit/shared (optional — чтобы не падал EditReviewModal по TS)
  loading?: string;
  mustLogin?: string;
  noEmail?: string;
  fillRequired?: string;

  success?: string;
  nameLabel?: string;
  emailLabel?: string;
  reviewLabel?: string;

  submittingLabel?: string;
  submitLabel?: string;
  cancelLabel?: string;
};

const DEFAULT_TEXTS: LeaveReviewModalText = {
  title: "Leave a review",
  subtitle: "Share your experience with this product",
  ratingLabel: "Rating",
  commentLabel: "Your review",
  commentPlaceholder: "Write your review here...",
  submitButton: "Submit",
  cancelButton: "Cancel",
  submitting: "Submitting...",
  successMessage: "Thanks! Your review was sent.",
  errorMessage: "Something went wrong. Please try again.",

  loading: "Loading...",
  mustLogin: "You must be logged in",
  noEmail: "Email is required",
  fillRequired: "Please fill all required fields",
  success: "Review updated successfully!",
  nameLabel: "Name",
  emailLabel: "Email",
  reviewLabel: "Your Review",
  submittingLabel: "Saving...",
  submitLabel: "Save Changes",
  cancelLabel: "Cancel",
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function LeaveReviewModal({
  open,
  onClose,
  productExternalId,
  texts,
}: {
  open: boolean;
  onClose: () => void;
  productExternalId: string;
  texts?: LeaveReviewModalText | null;
}) {
  const t = useMemo<LeaveReviewModalText>(() => {
    return { ...DEFAULT_TEXTS, ...(texts ?? {}) };
  }, [texts]);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState<string>("");

  if (!open) return null;

  async function submit() {
    setStatus("idle");
    setErrorText("");

    const trimmed = comment.trim();

    if (!productExternalId) {
      setStatus("error");
      setErrorText("Missing product id");
      return;
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setStatus("error");
      setErrorText("Please select a rating");
      return;
    }

    if (trimmed.length < 10) {
      setStatus("error");
      setErrorText("Comment must be at least 10 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: trimmed,
          shopify_product_id: productExternalId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorText(data?.error || t.errorMessage);
        return;
      }

      setStatus("success");
      setComment("");
      setRating(5);
      setHoverRating(0);

      setTimeout(() => onClose(), 700);
    } catch {
      setStatus("error");
      setErrorText(t.errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const active = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{t.title}</h3>
            {t.subtitle ? (
              <p className="mt-1 text-sm text-gray-400">{t.subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {/* ⭐ Rating */}
          <div>
            <label className="block text-sm font-medium text-white">
              {t.ratingLabel}
            </label>

            <div className="mt-2 flex items-center gap-2">
              <div
                className="flex items-center"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onMouseEnter={() => setHoverRating(v)}
                    onFocus={() => setHoverRating(v)}
                    onClick={() => setRating(v)}
                    className="p-1"
                    aria-label={`${v} star`}
                  >
                    <StarIcon
                      className={classNames(
                        active >= v ? "text-yellow-400" : "text-gray-600",
                        "h-7 w-7"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              <span className="text-sm text-gray-300 tabular-nums">
                {rating}/5
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-white">
              {t.commentLabel}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              className="mt-2 w-full rounded-md border border-white/10 bg-black/30 p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              rows={5}
            />
            <div className="mt-1 text-xs text-gray-500">Min 10 characters</div>
          </div>

          {status === "success" ? (
            <p className="text-sm text-green-400">{t.successMessage}</p>
          ) : null}

          {status === "error" ? (
            <p className="text-sm text-red-400">{errorText || t.errorMessage}</p>
          ) : null}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              {t.cancelButton}
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="flex-1 rounded-md border border-white/10 bg-yellow-400/20 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-400/30 disabled:opacity-60"
            >
              {loading ? t.submitting : t.submitButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
