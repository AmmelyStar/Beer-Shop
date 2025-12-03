"use client";

import { useState } from "react";

type BannerCookieClientProps = {
  text: string;
  acceptLabel: string;
  rejectLabel: string;
  policyLabel: string;
  policyHref: string;
};

const STORAGE_KEY = "cookie-consent"; // "accepted" | "rejected"

export default function BannerCookieClient({
  text,
  acceptLabel,
  rejectLabel,
  policyLabel,
  policyHref,
}: BannerCookieClientProps) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const value = window.localStorage.getItem(STORAGE_KEY);
    return !value;
  });

  const handleChoice = (choice: "accepted" | "rejected") => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, choice);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 px-6 pb-6 z-50">
      <div
        className="pointer-events-auto ml-auto rounded-2xl shadow-lg shadow-black/50 max-w-90 p-8
        ring-1 ring-white/15 dark:ring-stone/20
        bg-linear-to-b from-white/55 to-white/20
        dark:from-stone-950/75 dark:to-stone-950/80"
      >
        <p className="text-base/6 text-gray-300">
          {text}{" "}
          <a
            href={policyHref}
            className="font-semibold text-white underline hover:text-yellow-500"
          >
            {policyLabel}
          </a>
          .
        </p>
        <div className="mt-8 flex items-center gap-x-10">
          <button
            type="button"
            onClick={() => handleChoice("accepted")}
            className="rounded-md text-yellow-500 bg-linear-to-br from-stone-300/20 to-stone-900/50  px-3 py-2 text-base font-semibold  shadow-sm hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {acceptLabel}
          </button>
          <button
            type="button"
            onClick={() => handleChoice("rejected")}
            className="text-base/6 font-semibold text-white hover:text-gray-300"
          >
            {rejectLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
