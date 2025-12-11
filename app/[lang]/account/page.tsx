// app/[lang]/account/page.tsx

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getMessages, Locale } from "../messages";
import AccountContent from "../../components/AccountContent";
import LoginRegisterForm from "../../components/LoginRegisterForm";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateShopifyCustomer } from "@/app/lib/shopify/customerAdmin";

export type AccountPageMessages = {
  title: string;
  profileInformation: string;
  profileIntro: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  phonePlaceholder: string;
  birthday: string;
  gender: string;
  accountCreated: string;
  recentOrders: string;
  recentOrdersDescription: string;
  viewAllOrders: string;
  signingOut: string;
  signOut: string;
  profileSaveButton: string;
  profileSaving: string;
  profileSaveUnknownError: string;
  phoneErrorInvalid: string;
  phoneErrorTooShort: string;
  phoneErrorTooLong: string;
  sidebarGreeting: string;
  tabProfile: string;
  tabOrders: string;
  tabReviews: string;
  tabAddresses: string;
  genderLabelNotSet: string;
  genderLabelFemale: string;
  genderLabelMale: string;
  genderLabelOther: string;
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const messages = await getMessages(lang);

  const { userId } = await auth();

  let shopifyCustomerId: string | null = null;
  let shopifyError: string | null = null;

  if (userId) {
    try {
      shopifyCustomerId = await getOrCreateShopifyCustomer();
    } catch (error) {
      console.error("Account page: getOrCreateShopifyCustomer error:", error);
      shopifyError =
        error instanceof Error ? error.message : "Unknown error";
    }
  }

  return (
    <section className="relative mx-auto my-10 max-w-7xl overflow-hidden rounded-b-3xl">
      <h1 className="mb-4 hidden text-2xl font-semibold">
        {messages.AccountPage?.title ?? "My account"}
      </h1>

      <SignedIn>
        <AccountContent
          messages={messages.AccountPage}
          shopifyCustomerId={shopifyCustomerId}
          shopifyError={shopifyError}
        />
      </SignedIn>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <SignedOut>
          <LoginRegisterForm messages={messages.auth} />
        </SignedOut>
      </div>
    </section>
  );
}
