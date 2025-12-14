// app/components/ReviewModal.tsx

"use client";

import { useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productHandle: string;
  defaultName?: string;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type SubmitResponse = {
  ok?: boolean;
  status?: number;
  error?: string;
  raw?: string;
};

export default function ReviewModal({
  isOpen,
  onClose,
  productHandle,
  defaultName = "",
}: ReviewModalProps) {
  const [name, setName] = useState(defaultName);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const chars = text.length;
  const currentRating = hoverRating ?? rating;

  const handleSubmit = async () => {
    console.log("CLICK Submit review button");
    setError(null);
    setSuccess(null);

    const trimmed = text.trim();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (trimmed.length < 10) {
      setError("Review text must be at least 10 characters.");
      return;
    }

    if (trimmed.length > 200) {
      setError("Review text must be at most 200 characters.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (!productHandle) {
      setError("Missing product handle.");
      return;
    }

    setLoading(true);

    try {
      console.log("▶️ Sending fetch to /api/reviews/submit", {
        productHandle,
        rating,
        text: trimmed,
        name: name.trim(),
      });

      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productHandle,
          rating,
          text: trimmed,
          name: name.trim(),
        }),
      });

      let rawText = "";
      let data: SubmitResponse | null = null;

      try {
        rawText = await res.text();
        console.log("⬅️ Raw response from /api/reviews/submit:", rawText);
        data = rawText ? (JSON.parse(rawText) as SubmitResponse) : null;
      } catch (parseErr) {
        console.error("Failed to parse JSON from submit response:", parseErr);
      }

      const okFromApi = data?.ok ?? res.ok;

      if (!okFromApi) {
        const msg =
          data?.error ||
          `Failed to submit review. Status: ${data?.status ?? res.status}`;
        console.error("Submit review failed:", msg);
        setError(msg);
        return;
      }

      setSuccess("Thank you! Your review has been submitted.");
      setText("");
      setRating(5);
      setHoverRating(null);
      console.log("✅ Review submitted successfully");
      // можно закрывать:
      // onClose();
    } catch (err) {
      console.error("Submit review error:", err);
      setError("Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 p-6 shadow-xl border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Leave a review
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Tell us what you think about this product.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* БЕЗ <form>, просто div со всеми полями */}
        <div className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400"
            />
          </div>

          {/* Stars */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <StarIcon
                    className={classNames(
                      currentRating >= star
                        ? "text-yellow-400"
                        : "text-gray-600",
                      "h-6 w-6"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-400">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">
              Your review
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={200}
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400 resize-none"
              placeholder="Write at least 10 characters..."
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Min 10, max 200 characters</span>
              <span>{chars}/200</span>
            </div>
          </div>

          {/* Messages */}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-emerald-400">{success}</p>
          )}

          {/* Buttons */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-md bg-yellow-500 px-5 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Submit review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
