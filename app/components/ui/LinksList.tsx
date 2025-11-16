// app/components/ui/LinksList.tsx
import Link from "next/link";
import type { Locale } from "@/app/lib/locale";

type FooterMessages = {
  about: string;
  terms: string;
  delivery: string;
  refunds: string;
  contact: string;
  cookiesPolicy: string;
  privacyPolicy: string;
};

type LinksListProps = {
  lang: Locale;
  footerMessages: FooterMessages;
};

export default function LinksList({ lang, footerMessages }: LinksListProps) {
  const t = footerMessages;

  const links = [
    { href: `/${lang}/about`, label: t.about },
    { href: `/${lang}/privacy-policy`, label: t.privacyPolicy },
    { href: `/${lang}/terms`, label: t.terms },
    { href: `/${lang}/delivery`, label: t.delivery },
    { href: `/${lang}/refunds`, label: t.refunds },
    { href: `/${lang}/contact`, label: t.contact },
    { href: `/${lang}/cookies-policy`, label: t.cookiesPolicy },
  ];

  return (
    <nav className="flex flex-col gap-x-6 gap-y-2 text-sm text-gray-400 md:order-1">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:text-yellow-500"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
