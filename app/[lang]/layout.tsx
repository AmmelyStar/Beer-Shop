// app/[lang]/layout.tsx

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS, fiFI, ukUA, ruRU } from "@clerk/localizations";

import AgeVerificationBanner from "@/app/components/AgeVerificationBanner";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import BannerCookie from "@/app/components/BannerCookie";
import { CartProvider } from "@/app/context/CartContext";
import { etEE } from "@/app/i18n/clerk-et";

import { getMessages } from "./messages";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LOCALES = ["en", "et", "fi", "uk", "ru"] as const;

type Locale = (typeof LOCALES)[number];
type ClerkLocale = typeof enUS;

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

const CLERK_LOCALIZATIONS: Record<Locale, ClerkLocale> = {
  en: enUS,
  et: etEE,
  fi: fiFI,
  uk: ukUA,
  ru: ruRU,
};

export const metadata: Metadata = {
 metadataBase: new URL("www.beersnacks.ee"),
  

  title: {
    default: "Beer & Snacks",
    template: "%s | Beer & Snacks",
  },

  description: "Beer & Snacks — beer, cider and snacks store",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    siteName: "Beer & Snacks",
    title: "Beer & Snacks",
    description: "Beer, cider and snacks store",
    images: [
      {
        url: "/share-preview.png",
        width: 1200,
        height: 630,
        alt: "Beer & Snacks",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Beer & Snacks",
    description: "Beer, cider and snacks store",
    images: ["/share-preview.png"],
  },
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

type LayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ lang: string }>;
}>;

export default async function RootLayout({
  children,
  params,
}: LayoutProps) {
  const resolvedParams = await params;

  const lang: Locale = isLocale(resolvedParams.lang)
    ? resolvedParams.lang
    : "en";

  const messages = await getMessages(lang);

  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider localization={CLERK_LOCALIZATIONS[lang]}>
          <CartProvider>
            <Header
              lang={lang}
              messages={{
                HeaderNav: messages.HeaderNav,
                ShoppingCart: messages.ShoppingCart,
              }}
            />

            <AgeVerificationBanner />

            {children}

            <Footer lang={lang} />
            <BannerCookie lang={lang} />
          </CartProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}