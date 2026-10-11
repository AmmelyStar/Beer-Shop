// app/[lang]/partnership/page.tsx

import {
  Suspense,
} from "react";

import type {
  Locale,
} from "@/app/lib/locale";

import {
  fetchPageByHandle,
} from "@/app/data/repo";

import {
  getMessages,
} from "../messages";

import PartnershipClient from "./PartnershipClient";

type Props = {
  params: Promise<{
    lang: Locale;
  }>;
};

export default async function Page({
  params,
}: Props) {
  const { lang } =
    await params;

  const [
    messages,
    partnershipPage,
  ] = await Promise.all([
    getMessages(lang),

    fetchPageByHandle(
      "partnership-content",
      lang,
    ),
  ]);

  const t =
    messages.Partnership;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="text-neutral-300">
            Loading...
          </div>
        }
      >
        <PartnershipClient
          lang={lang}
          t={t}
          contentHtml={
            partnershipPage?.body ??
            null
          }
        />
      </Suspense>
    </main>
  );
}