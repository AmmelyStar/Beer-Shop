import FAQ from "@/app/components/ui/FAQ";
import { getFaq } from "@/app/lib/shopify/getFaq";
import { getMessages, type Locale } from "@/app/[lang]/messages";

export default async function FAQPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const faqs = await getFaq(lang);
  const messages = await getMessages(lang);

  return (
    <main>
      <FAQ
        title={messages.Questions.title}
        faqs={faqs.map(({ id, question, answer }) => ({
          id,
          question,
          answer,
        }))}
        emptyText={messages.Questions.empty}
      />
    </main>
  );
}
