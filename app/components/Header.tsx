// app/components/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/app/lib/locale";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import HeaderSearch from "./ui/HeaderSearch";
import ShoppingCart, { ShoppingCartMsgs } from "./ui/ShoppingCart";

type ShoppingCartMessages = ShoppingCartMsgs;

type HeaderNavMessages = {
  home: string;
  shop: string;
  contacts: string;
};

const SHOPPING_CART_FALLBACK: ShoppingCartMessages = {
  ariaLabel: "Shopping cart",
  emptyMessage: "Your cart is empty",
  checkoutButton: "Proceed to Checkout",
  itemsInCart: "items in cart, view bag",
};

const HEADER_NAV_FALLBACK: HeaderNavMessages = {
  home: "Home",
  shop: "Shop",
  contacts: "Contacts",
};

type Props = {
  lang: Locale;
  messages?: {
    ShoppingCart?: ShoppingCartMessages;
    HeaderNav?: HeaderNavMessages;
  };
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium tracking-wide text-white/80 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-xl px-4 py-3 text-base font-medium text-white/90 hover:bg-white/10 transition-colors"
    >
      {label}
    </Link>
  );
}

export default function Header({ lang, messages }: Props) {
  const router = useRouter();

  const cartMessages: ShoppingCartMessages =
    messages?.ShoppingCart ?? SHOPPING_CART_FALLBACK;

  const nav: HeaderNavMessages = messages?.HeaderNav ?? HEADER_NAV_FALLBACK;

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const goAccountFromMobileMenu = () => {
    setMobileOpen(false);
    router.push(`/${lang}/account`);
  };

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b border-white/10",
        mobileOpen ? "bg-[#061414]" : "bg-black/20 backdrop-blur-md",
      ].join(" ")}
      style={
        mobileOpen
          ? { backdropFilter: "none", WebkitBackdropFilter: "none" }
          : undefined
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* bigger on desktop */}
        <div className="grid h-20 md:h-24 grid-cols-[1fr_auto_1fr] items-center">
          {/* LEFT — desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href={`/${lang}`} label={nav.home} />
            <NavLink href={`/${lang}/shop`} label={nav.shop} />
            <NavLink href={`/${lang}/contact`} label={nav.contacts} />
          </nav>

          {/* LEFT — mobile burger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-white/85 hover:bg-white/10"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* CENTER — logo */}
          <Link
            href={`/${lang}`}
            className="mx-auto flex items-center md:px-6"
            aria-label="Beer & Snacks"
          >
            <img
              src="/category/beer_logo.svg"
              alt="Beer & Snacks"
              className="h-14 md:h-16 w-auto object-contain"
              draggable={false}
            />
          </Link>

          {/* RIGHT — desktop controls grouped */}
          <div className="hidden md:flex items-center justify-end md:pl-6">
            <div className="flex items-center gap-3 shrink-0">
              <LanguageSwitcher current={lang} />
              <HeaderSearch lang={lang} />
              <button
                onClick={() => router.push(`/${lang}/account`)}
                className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 20a8 8 0 0 1 16 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <span aria-hidden="true" className="mx-4 h-6 w-px bg-white/15" />

            <ShoppingCart
              lang={lang}
              href={`/${lang}/cart`}
              messages={cartMessages}
            />
          </div>

          {/* RIGHT — mobile cart */}
          <div className="md:hidden flex items-center justify-end">
            <ShoppingCart
              lang={lang}
              href={`/${lang}/cart`}
              messages={cartMessages}
            />
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* overlay */}
          <button
            className="absolute inset-0 bg-black"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />

          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-[#061414] border-l border-white/10">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-sm uppercase tracking-widest text-white/90">
                Menu
              </span>

              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-xl p-2 text-white/85 hover:bg-white/10"
                aria-label="Close menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* controls */}
            <div className="px-4 pt-4 pb-3">
              {/* Row 1: Language */}
              <div className="flex items-center justify-start">
                <LanguageSwitcher current={lang} />
              </div>

              {/* Row 2: Profile (left) + Search (right) */}
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goAccountFromMobileMenu}
                  className="rounded-xl p-2 text-white/85 hover:bg-white/10 transition-colors"
                  aria-label="Account"
                  title="Account"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M4 20a8 8 0 0 1 16 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* IMPORTANT:
                    Give HeaderSearch a full-width anchor area so its dropdown stays inside the menu.
                    We align the trigger button to the right. */}
                <div className="relative flex-1 flex justify-end">
                  <div className="w-full max-w-[340px]">
                    <HeaderSearch lang={lang} />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* nav links */}
            <div className="px-2 py-3">
              <MobileNavLink
                href={`/${lang}`}
                label={nav.home}
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                href={`/${lang}/shop`}
                label={nav.shop}
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                href={`/${lang}/contact`}
                label={nav.contacts}
                onClick={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
