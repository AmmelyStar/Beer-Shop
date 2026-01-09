// app/[lang]/partnership/PartnershipClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import type { Locale } from "@/app/lib/locale";

type PartnershipTranslations = {
  title: string;
  subtitle: string;
  imageAlt?: string;
  form: {
    firstname: string;
    lastname: string;
    emailLabel: string;
    company: string;
    phone: string;
    optional: string;
    message: string;
    messageLimit: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
};

type Props = {
  lang: Locale;
  t: PartnershipTranslations;
};

export default function PartnershipClient({ lang, t }: Props) {
  const searchParams = useSearchParams();

  // пример: /partnership?sent=1
  const sent = searchParams.get("sent") === "1";

  return (
    <section className="mt-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-white">{t.title}</h1>
        <p className="mt-2 text-neutral-300">{t.subtitle}</p>
      </header>

      {sent ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-200">
          {t.form.success}
        </div>
      ) : null}

      {/* Вставь сюда твой реальный компонент формы */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-neutral-300">
        <p className="text-sm">
          Тут должен быть твой компонент/форма Partnership. lang: {lang}
        </p>
      </div>
    </section>
  );
}
