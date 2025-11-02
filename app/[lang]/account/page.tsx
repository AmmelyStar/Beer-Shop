"use client";

import { useUser, UserProfile } from "@clerk/nextjs";
import Link from "next/link";

export default function AccountPage() {
  const { isSignedIn } = useUser();

  // если пользователь НЕ залогинен
  if (!isSignedIn) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-medium mb-4">
            Please sign in to manage your account.
          </p>

          <Link
            href="/sign-in"
            className="inline-block rounded-xl bg-black px-4 py-2 text-white text-sm font-semibold hover:bg-neutral-800"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  // если пользователь залогинен
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-start p-8">
      <div className="w-full max-w-xl mb-6 text-left">
        <Link
          href="/"
          className="inline-block rounded-xl border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          ← Back to site
        </Link>
      </div>

      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              card: "shadow-none border-0",
            },
          }}
        />
      </div>
    </main>
  );
}
