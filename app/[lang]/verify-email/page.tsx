"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import type { Locale } from "@/app/lib/locale";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const started = useRef(false);

  const {
    loaded,
    handleEmailLinkVerification,
  } = useClerk();

  const langParam = params?.lang;

  const lang = (
    Array.isArray(langParam)
      ? langParam[0]
      : langParam
  ) as Locale | undefined;

  const effectiveLang = lang || "en";

  useEffect(() => {
    if (!loaded || started.current) {
      return;
    }

    started.current = true;

    void handleEmailLinkVerification({
      redirectUrl: `${window.location.origin}/${effectiveLang}/account`,
    })
      .then(() => {
        router.replace(
          `/${effectiveLang}/account?verified=1`,
        );
      })
      .catch(() => {
        router.replace(
          `/${effectiveLang}/account?verification=failed`,
        );
      });
  }, [
    effectiveLang,
    handleEmailLinkVerification,
    loaded,
    router,
  ]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <p className="text-center text-base text-gray-300">
        Verifying your email…
      </p>
    </main>
  );
}