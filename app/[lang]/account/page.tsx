// app/[lang]/account/page.tsx

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getMessages, Locale } from "../messages";
import AccountContent from "../../components/AccountContent";
import LoginRegisterForm from "../../components/LoginRegisterForm";

export type AccountPageMessages = {
  title: string;
  profileInformation: string;
  email: string;
  name: string;
  accountCreated: string;
  recentOrders: string;
  recentOrdersDescription: string;
  viewAllOrders: string;
  signingOut: string;
  signOut: string;
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const messages = await getMessages(lang);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="mb-4 text-2xl font-semibold">
        {messages.AccountPage?.title ?? "My account"}
      </h1>

      {/* Если пользователь залогинен — показываем страницу аккаунта */}
      <SignedIn>
        <AccountContent messages={messages.AccountPage} />
      </SignedIn>

      {/* Если не залогинен — показываем нашу форму логина/регистрации */}
      <SignedOut>
        <LoginRegisterForm messages={messages.auth} />
      </SignedOut>
    </div>
  );
}
