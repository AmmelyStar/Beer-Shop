// app/components/BannerCookie.tsx
import type { Locale } from "@/app/lib/locale";
import { getMessages } from "@/app/[lang]/messages";
import BannerCookieClient from "./BannerCookieClient";

type Props = {
  lang: Locale;
};

export default async function BannerCookie({ lang }: Props) {
  const messages = await getMessages(lang);
  const t = messages.CookieBanner;

  return (
    <BannerCookieClient
      text={t.text}
      acceptLabel={t.accept}
      rejectLabel={t.reject}
      policyLabel={t.policyLink}
      policyHref={`/${lang}/cookies-policy`}
    />
  );
}
