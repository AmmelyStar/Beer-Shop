// app/components/AccountReviewsContent.tsx
"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/app/lib/locale";
import { AccountSidebar } from "@/app/components/ui/AccountSidebar";
import { X } from "lucide-react";

type AccountPageMessages = {
  signingOut: string;
  signOut: string;
  sidebarGreeting: string;
  tabProfile: string;
  tabOrders: string;
  tabReviews: string;
  tabAddresses: string;
};

type AccountReviewsContentProps = {
  messages?: AccountPageMessages;
};

type AccountReview = {
  id: string | number | null;
  rating: number | null;
  text: string | null;
  created_at?: string | null;

  product_title?: string | null;
  product_image_url?: string | null;
  product_handle?: string | null;
};

const FALLBACK_MESSAGES: AccountPageMessages = {
  signingOut: "Signing out...",
  signOut: "Sign out",
  sidebarGreeting: "Hello",
  tabProfile: "Profile",
  tabOrders: "My orders",
  tabReviews: "My reviews",
  tabAddresses: "Addresses",
};

function toReviewId(value: unknown): string | null {
  if (typeof value === "string") {
    const v = value.trim();
    return v.length ? v : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 5;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return Math.round(n);
}

function StarsReadOnly({ value }: { value: number }) {
  const v = clampRating(value);
  return (
    <div className="flex items-center gap-1 text-sm">
      {Array.from({ length: 5 }).map((_, i) => {
        const active = i < v;
        return (
          <span
            key={i}
            className={active ? "text-yellow-400" : "text-white/20"}
            aria-hidden
          >
            ★
          </span>
        );
      })}
      <span className="sr-only">{v} / 5</span>
    </div>
  );
}

function StarsEditable({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div className="flex items-center gap-1 text-base">
      {Array.from({ length: 5 }).map((_, idx) => {
        const star = idx + 1;
        const active = star <= shown;

        return (
          <button
            key={star}
            type="button"
            className="leading-none"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(star)}
            aria-label={`${star} star`}
          >
            <span className={active ? "text-yellow-400" : "text-white/20"} aria-hidden>
              ★
            </span>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-white/60">{value}/5</span>
    </div>
  );
}

export default function AccountReviewsContent({ messages }: AccountReviewsContentProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const params = useParams();

  const messagesSafe = messages ?? FALLBACK_MESSAGES;

  useEffect(() => {
    if (!messages) {
      console.warn(
        "[AccountReviewsContent] messages prop is undefined. Fix page: <AccountReviewsContent messages={t.AccountPage} />"
      );
    }
  }, [messages]);

  const [loadingLogout, setLoadingLogout] = useState(false);
  const [reviews, setReviews] = useState<AccountReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<{
    id: string;
    rating: number;
    text: string;
    title?: string | null;
  } | null>(null);

  const langFromParams = (params as { lang?: string | string[] } | null)?.lang;
  const lang = (Array.isArray(langFromParams) ? langFromParams[0] : langFromParams) as
    | Locale
    | undefined;

  const effectiveLang = (lang || "en") as Locale;
  const baseAccountPath = `/${effectiveLang}/account`;

  const navItems = useMemo(() => {
    return [
      { href: baseAccountPath, label: messagesSafe.tabProfile },
      { href: `${baseAccountPath}/orders`, label: messagesSafe.tabOrders },
      { href: `${baseAccountPath}/reviews`, label: messagesSafe.tabReviews },
      { href: `${baseAccountPath}/addresses`, label: messagesSafe.tabAddresses },
    ];
  }, [
    baseAccountPath,
    messagesSafe.tabProfile,
    messagesSafe.tabOrders,
    messagesSafe.tabReviews,
    messagesSafe.tabAddresses,
  ]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadReviews = async () => {
      setError(null);
      try {
        const res = await fetch(
          `/api/account/reviews?lang=${encodeURIComponent(effectiveLang)}`,
          { cache: "no-store" }
        );

        if (res.status === 401) {
          if (!cancelled) setReviews([]);
          return;
        }

        const data = (await res.json().catch(() => ({}))) as { reviews?: AccountReview[] };

        if (!res.ok) {
          console.warn("Failed to load reviews", data);
          if (!cancelled) setReviews([]);
          return;
        }

        if (!cancelled) setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (e) {
        console.warn("Reviews load error", e);
        if (!cancelled) setReviews([]);
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [user, effectiveLang]);

  const handleSignOut = async () => {
    setLoadingLogout(true);
    try {
      await signOut({ redirectUrl: `/${effectiveLang}/account` });
    } catch (e) {
      console.error("Sign out error:", e);
      setLoadingLogout(false);
    }
  };

  const openEdit = (r: AccountReview) => {
    const id = toReviewId(r.id);
    if (!id) {
      setError("Invalid review id");
      return;
    }
    setEditing({
      id,
      rating: clampRating(typeof r.rating === "number" ? r.rating : 5),
      text: typeof r.text === "string" ? r.text : "",
      title: r.product_title ?? null,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;

    const reviewId = toReviewId(editing.id);
    if (!reviewId) {
      setError("Invalid review id");
      return;
    }

    setBusyId(reviewId);
    setError(null);

    try {
      const payload = {
        reviewId,
        rating: clampRating(editing.rating),
        text: editing.text ?? "",
      };

      const res = await fetch("/api/account/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error || "Failed to update review");
      }

      const json = (await res.json().catch(() => ({}))) as {
        review?: Partial<AccountReview>;
      };

      setReviews((prev) =>
        (prev ?? []).map((r) => {
          const id = toReviewId(r.id);
          if (id !== reviewId) return r;
          return { ...r, rating: payload.rating, text: payload.text, ...(json.review ?? {}) };
        })
      );

      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update review");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (rawId: unknown) => {
    const reviewId = toReviewId(rawId);
    if (!reviewId) {
      setError("Invalid review id");
      return;
    }

    setBusyId(reviewId);
    setError(null);

    try {
      const res = await fetch(`/api/account/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error || "Failed to delete review");
      }

      setReviews((prev) => (prev ?? []).filter((r) => toReviewId(r.id) !== reviewId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  };

  if (!isLoaded) {
    return (
      <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-yellow-400" />
        </div>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
      {/* ✅ ВОТ ТУТ КЛЮЧЕВОЕ: flex-col на мобилке, flex-row на lg — как на твоём скрине */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        {/* sidebar слева */}
        <div className="w-full lg:w-[360px] xl:w-[380px]">
          <AccountSidebar
            user={user}
            navItems={navItems}
            baseAccountPath={baseAccountPath}
            effectiveLang={effectiveLang}
            onSignOut={handleSignOut}
            signingOutLabel={messagesSafe.signingOut}
            signOutLabel={messagesSafe.signOut}
            greetingLabel={messagesSafe.sidebarGreeting}
            loading={loadingLogout}
          />
        </div>

        {/* контент справа */}
        <div className="w-full flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">{messagesSafe.tabReviews}</h1>
            <p className="mt-1 text-sm text-white/60">Here you can edit or delete your reviews.</p>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
              {error}
            </div>
          ) : null}

          {reviews === null ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-yellow-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              You don&apos;t have any reviews yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {reviews.map((r) => {
                const id = toReviewId(r.id);
                const isBusy = !!id && busyId === id;

                return (
                  <div
                    key={id ?? String(Math.random())}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        {r.product_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.product_image_url}
                            alt={r.product_title ?? "Product"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs opacity-60">
                            —
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {r.product_title ?? "Product"}
                            </div>
                            <div className="mt-1">
                              <StarsReadOnly value={typeof r.rating === "number" ? r.rating : 5} />
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                              onClick={() => openEdit(r)}
                              disabled={!id || isBusy}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                              onClick={() => void handleDelete(r.id)}
                              disabled={!id || isBusy}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {r.text ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">{r.text}</p>
                        ) : (
                          <p className="mt-3 text-sm text-white/60">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold">Edit review</div>
                <div className="truncate text-sm text-white/60">{editing.title ?? "Product"}</div>
              </div>

              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 disabled:opacity-50"
                onClick={() => setEditing(null)}
                disabled={busyId === editing.id}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <div className="mb-2 text-sm text-white/70">Rating</div>
                <StarsEditable
                  value={clampRating(editing.rating)}
                  onChange={(next) => setEditing((p) => (p ? { ...p, rating: next } : p))}
                />
              </div>

              <label className="grid gap-2 text-sm">
                <span className="text-white/70">Review</span>
                <textarea
                  value={editing.text}
                  onChange={(e) => setEditing((p) => (p ? { ...p, text: e.target.value } : p))}
                  rows={5}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:bg-white/10"
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                  onClick={() => setEditing(null)}
                  disabled={busyId === editing.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                  onClick={() => void saveEdit()}
                  disabled={busyId === editing.id}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
