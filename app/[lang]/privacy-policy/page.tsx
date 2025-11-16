// app/[locale]/privacy-policy/page.tsx
import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const page = await fetchPageByHandle("privacy-policy", lang);

  if (!page) {
    notFound();
  }

  return <LegalPageLayout title={page.title} html={page.body} />;
}
