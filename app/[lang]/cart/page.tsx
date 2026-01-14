// app/[lang]/cart/page.tsx
import type { Locale } from "@/app/lib/locale";
import CartClient from "./CartClient";
import { getMessages } from "../messages"; // ✅ app/[lang]/messages.ts

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ lang: Locale }>;           // ✅ Next 16: Promise
  searchParams?: Promise<SearchParams>;        // ✅ Next 16: Promise
};

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params;               // ✅ unwrap
  const sp = searchParams ? await searchParams : {}; // ✅ unwrap

  const checkout = typeof sp.checkout === "string" ? sp.checkout : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const success = checkout === "success" || status === "success";
  const cancel = checkout === "cancel" || status === "cancel";

  const messages = await getMessages(lang);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <CartClient
        lang={lang}
        success={success}
        cancel={cancel}
        cartMsgs={messages.ShoppingCardOverviews} // ✅ вот это ключевое
      />
    </main>
  );
}
