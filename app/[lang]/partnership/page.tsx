import ContactContent from "../../components/ContactContent";
import { getMessages } from "@/app/[lang]/messages";
import type { Locale } from "@/app/lib/locale";

export default async function PartnershipPage() {
  const lang = "en" as Locale; // оставляю как у тебя сейчас (без lang в URL)
  const messages = await getMessages(lang);

  return (
    <main className="bg-[var(--background)]">
      <ContactContent lang={lang} messages={messages} />
    </main>
  );
}
