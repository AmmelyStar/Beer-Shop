// app/components/AccountContent.tsx

"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import { useState } from "react";
import type { AccountPageMessages } from "../[lang]/account/page";

export default function AccountContent({
  messages,
}: {
  messages: AccountPageMessages;
}) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);

  const langFromParams = params?.lang;
  const lang = (
    Array.isArray(langFromParams) ? langFromParams[0] : langFromParams
  ) as Locale | undefined;
  const effectiveLang = (lang || "en") as Locale;

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut({ redirectUrl: `/${effectiveLang}/account` });
    } catch (error) {
      console.error("Sign out error:", error);
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Информация о пользователе */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">
          {messages.profileInformation}
        </h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">{messages.email}</p>
            <p className="text-base text-white">
              {user.primaryEmailAddress?.emailAddress || "—"}
            </p>
          </div>

          {(user.firstName || user.lastName) && (
            <div>
              <p className="text-sm text-gray-400">{messages.name}</p>
              <p className="text-base text-white">
                {user.firstName} {user.lastName || ""}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400">{messages.accountCreated}</p>
            <p className="text-base text-white">
              {new Date(user.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Заказы — позже подцепим Shopify */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">
          {messages.recentOrders}
        </h2>
        <p className="text-gray-400">{messages.recentOrdersDescription}</p>
      </div>

      {/* Действия */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push(`/${effectiveLang}/orders`)}
          className="flex-1 px-6 py-3 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
        >
          {messages.viewAllOrders}
        </button>

        <button
          onClick={handleSignOut}
          disabled={loading}
          className="flex-1 px-6 py-3 rounded-md border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? messages.signingOut : messages.signOut}
        </button>
      </div>
    </div>
  );
}
