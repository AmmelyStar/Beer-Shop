// app/[locale]/about/page.tsx
import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";

export default async function AboutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;

  const page = await fetchPageByHandle("about-us", locale);

  if (!page) notFound();

  return (
    <main>
      <LegalPageLayout title={page.title} html={page.body} />
    </main>
  );
}
