// proxy.ts (ROOT)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Уже есть префикс локали?
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return;

  // Редиректим / и любые пути без локали -> /{locale}/...
  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

// ОБЯЗАТЕЛЬНО: матчим корень и все пути, кроме статики
export const config = {
  matcher: ["/", "/((?!_next|.*\\..*).*)"],
};
