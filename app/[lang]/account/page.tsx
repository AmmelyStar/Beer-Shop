// app/[lang]/account/page.tsx

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getMessages, type Locale } from "../messages";
import AccountContent from "../../components/AccountContent";
import LoginRegisterForm from "../../components/LoginRegisterForm";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateShopifyCustomer } from "@/app/lib/shopify/customerAdmin";

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
  params: { lang: Locale };
}) {
  const { lang } = params;
  const messages = await getMessages(lang);

  // Проверяем, залогинен ли пользователь на сервере
  const { userId } = await auth();

  let shopifyCustomerId: string | null = null;

  if (userId) {
    try {
      shopifyCustomerId = await getOrCreateShopifyCustomer();
    } catch (err) {
      console.error("Failed to sync Shopify customer:", err);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="mb-4 text-2xl font-semibold">
        {messages.AccountPage?.title ?? "My account"}
      </h1>

      <SignedIn>
        <AccountContent
          messages={messages.AccountPage}
          shopifyCustomerId={shopifyCustomerId}
        />
      </SignedIn>

      <SignedOut>
        <LoginRegisterForm messages={messages.auth} />
      </SignedOut>
    </div>
  );
}
