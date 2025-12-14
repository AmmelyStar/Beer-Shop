// app/components/ReviewModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";

type EditingReview = {
  id: string;
  rating: number;
  text: string;
  name: string;
};

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productHandle: string;
  defaultName?: string;

  // новое:
  editing?: EditingReview | null;
  onSuccess?: () => void;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type ApiResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export default function ReviewModal({
  isOpen,
  onClose,
  productHandle,
  defaultName = "",
  editing = null,
  onSuccess,
}: ReviewModalProps) {
  const isEditMode = !!editing;

  const [name, setName] = useState(defaultName);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Когда модалка открывается или меняется режим (create/edit) — заполняем поля
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccess(null);
    setHoverRating(null);

    if (editing) {
      setName(editing.name ?? "");
      setRating(editing.rating ?? 5);
      setText(editing.text ?? "");
    } else {
      setName(defaultName ?? "");
      setRating(5);
      setText("");
    }
  }, [isOpen, editing, defaultName]);

  const currentRating = hoverRating ?? rating;

  const chars = text.length;

  const title = useMemo(() => (isEditMode ? "Edit review" : "Leave a review"), [isEditMode]);
  const subtitle = useMemo(
    () =>
      isEditMode
        ? "Update your rating and text. After editing, the review may be re-moderated."
        : "Tell us what you think about this product.",
    [isEditMode]
  );

  if (!isOpen) return null;

  const validate = () => {
    const trimmed = text.trim();

    if (!name.trim()) {
      return "Please enter your name.";
    }
    if (trimmed.length < 10) {
      return "Review text must be at least 10 characters.";
    }
    if (trimmed.length > 200) {
      return "Review text must be at most 200 characters.";
    }
    if (rating < 1 || rating > 5) {
      return "Please select a rating from 1 to 5 stars.";
    }
    if (!productHandle) {
      return "Missing product handle.";
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = text.trim();

    setLoading(true);
    try {
      let res: Response;

      if (isEditMode && editing?.id) {
        // UPDATE
        res = await fetch(`/api/reviews/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            text: trimmed,
            name: name.trim(),
          }),
        });
      } else {
        // CREATE
        res = await fetch(`/api/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productHandle,
            rating,
            text: trimmed,
            name: name.trim(),
          }),
        });
      }

      const raw = await res.text();
      let data: ApiResponse = {};
      try {
        data = raw ? (JSON.parse(raw) as ApiResponse) : {};
      } catch {
        // если ответ не JSON
        data = { ok: res.ok, error: raw?.slice(0, 200) };
      }

      const okFromApi = data.ok ?? res.ok;

      if (!okFromApi) {
        setError(data.error || `Request failed. Status: ${res.status}`);
        return;
      }

      // Успех
      setSuccess(
        data.message ||
          (isEditMode
            ? "Your review has been updated."
            : "Thank you! Your review has been submitted.")
      );

      // Дадим UI обновиться + рефрешим список
      onSuccess?.();

      // можно закрывать сразу (чаще UX лучше)
      onClose();
    } catch (e) {
      console.error("Review submit/update error:", e);
      setError(isEditMode ? "Failed to update review." : "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 p-6 shadow-xl border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
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
                      currentRating >= star ? "text-yellow-400" : "text-gray-600",
                      "h-6 w-6"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-400">{rating} / 5</span>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Your review</label>
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
          {success && <p className="text-sm text-emerald-400">{success}</p>}

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
              {loading ? "Sending..." : isEditMode ? "Save changes" : "Submit review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
