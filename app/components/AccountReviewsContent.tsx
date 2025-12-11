// app/components/AccountReviewsContent.tsx

"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useParams } from "next/navigation";

import type { Locale } from "@/app/lib/locale";
import type { AccountPageMessages } from "@/app/[lang]/account/page";
import { AccountSidebar } from "./ui/AccountSidebar";

type Review = {
  id: number;
  title: string;
  body: string;
  rating: number;
  reviewerName: string;
  createdAt: string;
  productTitle: string;
  productHandle: string;
};

type AccountReviewsContentProps = {
  messages: AccountPageMessages;
};

export default function AccountReviewsContent({
  messages,
}: AccountReviewsContentProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const params = useParams();

  const [loadingSignOut, setLoadingSignOut] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const langFromParams = params?.lang;
  const lang = (
    Array.isArray(langFromParams) ? langFromParams[0] : langFromParams
  ) as Locale | undefined;
  const effectiveLang = (lang || "en") as Locale;

  const baseAccountPath = `/${effectiveLang}/account`;

  const navItems = [
    { href: baseAccountPath, label: messages.tabProfile },
    { href: `${baseAccountPath}/orders`, label: messages.tabOrders },
    { href: `${baseAccountPath}/reviews`, label: messages.tabReviews },
    { href: `${baseAccountPath}/addresses`, label: messages.tabAddresses },
  ];

  const handleSignOut = async () => {
    setLoadingSignOut(true);
    try {
      await signOut({ redirectUrl: `/${effectiveLang}/account` });
    } catch (error) {
      console.error("Sign out error:", error);
      setLoadingSignOut(false);
    }
  };

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        const res = await fetch("/api/account/reviews");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.error || "Failed to load reviews";
          throw new Error(msg);
        }

        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
        setReviewsError(
          err instanceof Error ? err.message : "Failed to load reviews"
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-yellow-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
      {/* левый сайдбар */}
      <AccountSidebar
        user={user}
        navItems={navItems}
        baseAccountPath={baseAccountPath}
        effectiveLang={effectiveLang}
        onSignOut={handleSignOut}
        signingOutLabel={messages.signingOut}
        signOutLabel={messages.signOut}
        greetingLabel={messages.sidebarGreeting}
        loading={loadingSignOut}
      />

      {/* правый контент */}
      <main className="mt-10 gap-12 space-y-6 lg:col-span-8 lg:mt-0">
        <section className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-2 text-xl font-semibold text-white">
            {messages.tabReviews}
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            These are the reviews you&apos;ve written in our store.
          </p>

          {reviewsLoading && (
            <p className="text-sm text-gray-400">Loading your reviews...</p>
          )}

          {reviewsError && (
            <p className="text-sm text-red-400">{reviewsError}</p>
          )}

          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <p className="text-sm text-gray-400">
              You haven&apos;t written any reviews yet.
            </p>
          )}

          {!reviewsLoading && !reviewsError && reviews.length > 0 && (
            <div className="mt-4 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-md border border-white/10 bg-black/20 p-4"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {review.productTitle || "Product"}
                      </p>
                      <h3 className="text-base font-semibold text-white">
                        {review.title || "Review"}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                      <p className="text-xs text-gray-300">
                        {review.rating} / 5 ★
                      </p>
                    </div>
                  </header>

                  <p className="mt-3 whitespace-pre-line text-sm text-gray-200">
                    {review.body}
                  </p>

                  {review.productHandle && (
                    <div className="mt-3 text-xs">
                      <a
                        href={`/${effectiveLang}/product/${review.productHandle}`}
                        className="text-yellow-300 underline hover:text-yellow-200"
                      >
                        View product
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
