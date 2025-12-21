// app/[locale]/contact/page.tsx
import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";
import ContactContent from "@/app/components/ContactContent";
import { getMessages } from "../messages";

export default async function ContactPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;

  const page = await fetchPageByHandle("contact-1", locale);
  if (!page) notFound();

  const messages = await getMessages(locale);

  return (
    <main>
      <LegalPageLayout title={page.title} html={page.body} />
      <ContactContent lang={locale} messages={{ Contact: messages.Contact }} />
    </main>
  );
}
