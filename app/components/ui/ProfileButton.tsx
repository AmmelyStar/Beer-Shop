"use client";
import Link from "next/link";
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
      <Link
        href={`/${lang}/account`}
        aria-label="Account"
        className="p-2 text-gray-400 hover:text-yellow-500"
      >
        <UserIcon aria-hidden="true" className="size-6" />
        <span className="sr-only">Account</span>
      </Link>
    </div>
  );
}
