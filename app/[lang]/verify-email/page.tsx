// app/[lang]/verify-email/page.tsx

"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  useParams,
  useRouter,
} from "next/navigation";

import type { Locale } from "@/app/lib/locale";

const VERIFYING_TEXT: Record<Locale, string> = {
  en: "Verifying your email…",
  ru: "Подтверждаем вашу электронную почту…",
  uk: "Підтверджуємо вашу електронну пошту…",
  et: "Kinnitame teie e-posti aadressi…",
  fi: "Vahvistetaan sähköpostiosoitettasi…",
};

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

  const effectiveLang: Locale = lang || "en";

  useEffect(() => {
    if (!loaded || started.current) {
      return;
    }

    started.current = true;

    const successUrl =
      `${window.location.origin}/${effectiveLang}/account?verified=1`;

    void handleEmailLinkVerification({
      redirectUrl: successUrl,
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
      <p
        role="status"
        aria-live="polite"
        className="text-center text-base text-gray-300"
      >
        {VERIFYING_TEXT[effectiveLang] ??
          VERIFYING_TEXT.en}
      </p>
    </main>
  );
}