// app/[lang]/account/addresses/page.tsx (SERVER component)
import { getMessages, Locale } from "../../messages";
import AccountAddressesContent from "@/app/components/AccountAddressesContent";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const messages = await getMessages(lang);

  const accountMessages = messages.AccountPage;
  const addressMessages = messages.AccountAddressesPage;

  return (
    <AccountAddressesContent
      accountMessages={accountMessages}
      addressMessages={addressMessages}
    />
  );
}
