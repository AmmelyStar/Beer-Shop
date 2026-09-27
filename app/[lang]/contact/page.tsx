import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";

import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";

type ContactPageProps = {
  params: Promise<{
    lang: Locale;
  }>;
};

export default async function ContactPage({
  params,
}: ContactPageProps) {
  const { lang } = await params;

  const page = await fetchPageByHandle(
    "contact-1",
    lang
  );

  if (!page) {
    notFound();
  }

  return (
    <main>
      <LegalPageLayout
        title={page.title}
        html={page.body}
      />
    </main>
  );
}