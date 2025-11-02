"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { UserIcon } from "@heroicons/react/24/outline";
import type { Locale } from "@/app/lib/locale";

export default function ProfileButton({
  lang,
  className = "",
}: {
  lang: Locale;
  className?: string;
}) {
  return (
    <div className={className}>
      <SignedIn>
        <UserButton userProfileUrl={`/${lang}/account`} />
      </SignedIn>

      <SignedOut>
        <SignInButton
          mode="modal"
          forceRedirectUrl={`/${lang}/account`}
          fallbackRedirectUrl={`/${lang}/account`}
        >
          <button
            aria-label="Account"
            className="-m-2 p-2 text-gray-200 hover:text-yellow-500 "
          >
            <UserIcon aria-hidden="true" className="size-6" />
            <span className="sr-only">Account</span>
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
