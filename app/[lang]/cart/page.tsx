// app/[lang]/cart/page.tsx
import type { Locale } from "@/app/lib/locale";
import CartClient from "./CartClient";

// Если у тебя НЕ static export — можно оставить.
// Если next.config.js -> output: "export" — удали эту строку.
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: { lang: Locale };
  searchParams?: SearchParams;
};

export default async function Page({ params, searchParams }: Props) {
  const { lang } = params;

  const checkout =
    typeof searchParams?.checkout === "string" ? searchParams.checkout : undefined;
  const status =
    typeof searchParams?.status === "string" ? searchParams.status : undefined;

  const success = checkout === "success" || status === "success";
  const cancel = checkout === "cancel" || status === "cancel";

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <CartClient lang={lang} success={success} cancel={cancel} />
    </main>
  );
}
