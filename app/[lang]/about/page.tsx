import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";

type AboutPageProps = {
  params: Promise<{
    lang: Locale;
  }>;
};

export default async function AboutPage({
  params,
}: AboutPageProps) {
  const { lang } = await params;

  const page = await fetchPageByHandle(
    "about-us",
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