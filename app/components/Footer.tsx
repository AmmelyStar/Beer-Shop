// app/components/Footer.tsx

import Link from "next/link";
import type { Locale } from "@/app/lib/locale";
import { getMessages } from "@/app/[lang]/messages";
import type { SVGProps } from "react";
import type { JSX } from "react/jsx-runtime";

type FooterProps = {
  lang: Locale;
};

const social = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61574467306145&rdid=dyUgwutEpbxUJBR3&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GwRm9d6vx%2F",
    icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}> <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /> </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/tallinnbeersnacks?utm_source=qr&igsh=YXkyM3IyYW5ueW02",
    icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}> <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.350.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /> </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@beer_and_snacks.tallinn",
    icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M16.6 5.82c-.37-.42-.64-.92-.8-1.46-.12-.42-.18-.86-.18-1.3h-3.1v13.2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4.03.58.09V11.2c-.2-.03-.39-.04-.58-.04-2.82 0-5.1 2.28-5.1 5.1s2.28 5.1 5.1 5.1 5.1-2.28 5.1-5.1V9.94c1.3.93 2.88 1.48 4.58 1.48V8.36c-1.32 0-2.55-.57-3.6-1.54z" />
      </svg>
    ),
  },
];

export default async function Footer({ lang }: FooterProps) {
  const messages = await getMessages(lang);
  const t = messages.Footer;

  // ✅ динамический год
  const year = new Date().getFullYear();
  const copyright =
    (t.copyright as string).replace("{{year}}", String(year));

  const catalogLinks: Array<{ label: string; href: string }> = [
    { label: t.catalog.all, href: `/${lang}/shop` },
    { label: t.catalog["beer in bottles"], href: `/${lang}/shop?category=beer%20in%20bottles` },
     { label: t.catalog["Draft Beer"], href: `/${lang}/shop?category=Draft%20Beer` },
    { label: t.catalog["Cider"], href: `/${lang}/shop?category=Cider` },
    { label: t.catalog["energy drink"], href: `/${lang}/shop?category=energy%20drink` },
    { label: t.catalog["non-alcoholic beer"], href: `/${lang}/shop?category=non-alcoholic%20beer` },
    { label: t.catalog["snacks"], href: `/${lang}/shop?category=snacks` },
    { label: t.catalog["sparkling wine"], href: `/${lang}/shop?category=sparkling%20wine` },
    { label: t.catalog["Soft Drinks"], href: `/${lang}/shop?category=Soft%20Drinks` },
  ];

  const columns = [
    { title: t.catalog.title, links: catalogLinks },
    {
      title: t.customers.title,
      links: [
        { label: t.customers.faq, href: `/${lang}/questions` },
        { label: t.customers.shippingPayment, href: `/${lang}/delivery` },
        { label: t.customers.returns, href: `/${lang}/refunds` },
        { label: t.customers.cookiePolicy, href: `/${lang}/cookies-policy` },
        { label: t.customers.publicOffer, href: `/${lang}/privacy-policy` },
      ],
    },
    {
      title: t.company.title,
      links: [
        { label: t.company.aboutUs, href: `/${lang}/about` },
        { label: t.company.partnership, href: `/${lang}/partnership` },
        { label: t.company.contacts, href: `/${lang}/contact` },
      ],
    },
  ];

  return (
    <footer className="bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-t border-b border-neutral-600/70 py-12">
          <div className="grid gap-12 md:grid-cols-3 md:gap-16">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-base font-medium text-neutral-200">
                  {col.title}
                </h3>

                <ul className="mt-6 space-y-3">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.href}-${l.label}`}>
                      <Link
                        href={l.href}
                        className="text-base text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-sm text-neutral-400">{t.followUs}</p>

            <div className="flex items-center justify-center gap-6">
              {social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-yellow-500 transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon aria-hidden="true" className="size-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="py-8 text-center md:text-left">
          <p className="text-sm text-neutral-400">{copyright}</p>
          <p className="mt-1 text-xs text-neutral-500">{t.prodused}</p>
        </div>
      </div>
    </footer>
  );
}
