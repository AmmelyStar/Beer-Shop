// app/[lang]/account/reviews/page.tsx

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getMessages, type Locale } from "../../messages";
import LoginRegisterForm from "../../../components/LoginRegisterForm";
import AccountReviewsContent from "../../../components/AccountReviewsContent";

export default async function AccountReviewsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const messages = await getMessages(lang);

  return (
    <section className="relative mx-auto my-10 max-w-7xl overflow-hidden rounded-b-3xl">
      <SignedIn>
        <AccountReviewsContent messages={messages.AccountPage} />
      </SignedIn>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <SignedOut>
          <LoginRegisterForm messages={messages.auth} />
        </SignedOut>
      </div>
    </section>
  );
}
