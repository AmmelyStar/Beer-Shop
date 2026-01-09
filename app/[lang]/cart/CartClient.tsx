// app/[lang]/cart/CartClient.tsx
"use client";

import type { Locale } from "@/app/lib/locale";

type Props = {
  lang: Locale;
  success: boolean;
  cancel: boolean;
};

export default function CartClient({ lang, success, cancel }: Props) {
  return (
    <section className="mt-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Cart</h1>
      </header>

      {success ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-200">
          Payment successful.
        </div>
      ) : null}

      {cancel ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-200">
          Payment cancelled.
        </div>
      ) : null}

      {/* Подключай сюда твой реальный UI корзины */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-neutral-300">
        <p className="text-sm">Cart UI goes here. lang: {lang}</p>
      </div>
    </section>
  );
}
