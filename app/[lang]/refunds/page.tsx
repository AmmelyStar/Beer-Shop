import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";

type RefundsPageProps = {
  params: Promise<{
    lang: Locale;
  }>;
};

export default async function RefundsPage({
  params,
}: RefundsPageProps) {
  const { lang } = await params;

  const page = await fetchPageByHandle(
    "refunds",
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