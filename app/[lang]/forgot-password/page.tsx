// app/[lang]/forgot-password/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getMessages, Locale } from "../messages";
import ForgotPasswordForm from "../../components/auth/ForgotPassword";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const messages = await getMessages(lang);

  // если пользователь уже залогинен — отправляем в аккаунт
  const { userId } = await auth();
  if (userId) {
    redirect(`/${lang}/account`);
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="mb-4 text-2xl font-semibold">
        {messages.auth.forgotPassword}
      </h1>

      <ForgotPasswordForm messages={messages.auth} />
    </div>
  );
}
