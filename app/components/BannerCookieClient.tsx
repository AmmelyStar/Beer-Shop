"use client";

import { useState, useSyncExternalStore } from "react";

type BannerCookieClientProps = {
  text: string;
  acceptLabel: string;
  rejectLabel: string;
  policyLabel: string;
  policyHref: string;
};

const STORAGE_KEY = "cookie-consent";
const CONSENT_EVENT = "cookie-consent-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function getClientSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === null;
  } catch {
    return true;
  }
}

function getServerSnapshot() {
  return false;
}

export default function BannerCookieClient({
  text,
  acceptLabel,
  rejectLabel,
  policyLabel,
  policyHref,
}: BannerCookieClientProps) {
  const shouldShow = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const [dismissed, setDismissed] = useState(false);

  const handleChoice = (choice: "accepted" | "rejected") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
      window.dispatchEvent(new Event(CONSENT_EVENT));
    } catch {
      // Баннер всё равно закрывается в текущей вкладке
    }

    setDismissed(true);
  };

  if (!shouldShow || dismissed) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-6 pb-6">
      <div
        className="
          pointer-events-auto ml-auto max-w-90 rounded-2xl p-8
          bg-linear-to-b from-white/55 to-white/20
          shadow-lg shadow-black/50 ring-1 ring-white/15
          dark:from-stone-950/75 dark:to-stone-950/80
          dark:ring-stone/20
        "
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
            className="
              rounded-md bg-linear-to-br from-stone-300/20 to-stone-900/50
              px-3 py-2 text-base font-semibold text-yellow-500 shadow-sm
              hover:bg-white/15
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-white
            "
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