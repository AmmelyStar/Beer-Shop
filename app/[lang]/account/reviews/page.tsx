// app/[lang]/account/reviews/page.tsx
import type { Locale } from "@/app/lib/locale";
import { getMessages } from "@/app/[lang]/messages";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import LoginRegisterForm from "@/app/components/LoginRegisterForm";
import AccountReviewsContent from "@/app/components/AccountReviewsContent";

export default async function AccountReviewsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const t = await getMessages(lang);

  return (
    <section className="relative mx-auto my-10 max-w-7xl overflow-hidden rounded-b-3xl">
      <SignedOut>
        <LoginRegisterForm messages={t.auth} />
      </SignedOut>

      <SignedIn>
        <AccountReviewsContent messages={t.AccountPage} />
      </SignedIn>
    </section>
  );
}
