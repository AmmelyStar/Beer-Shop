// proxy.ts (ROOT)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import Negotiator from "negotiator";
import { match as matchLocale } from "@formatjs/intl-localematcher";

const locales = ["en", "et", "fi", "uk", "ru"] as const;
const defaultLocale = "en";

function getLocale(request: NextRequest) {
  const accept = request.headers.get("accept-language") ?? "";
  const languages = new Negotiator({
    headers: { "accept-language": accept },
  }).languages();
  return matchLocale(languages, locales, defaultLocale);
}

// ВАЖНО: теперь proxy = clerkMiddleware(...) 
export const proxy = clerkMiddleware((auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Уже есть префикс локали?
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return; // ничего не делаем, продолжаем обработку

  // Редиректим / и любые пути без локали -> /{locale}/...
  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
});

// matcher остаётся твоим, можно немного расширить при желании
export const config = {
  matcher: ["/", "/((?!_next|.*\\..*).*)"],
};
