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

// ⬇️ ВАЖНО: export const proxy = функция (clerkMiddleware вернёт функцию)
export const proxy = clerkMiddleware((auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // 1. API-роуты — пропускаем БЕЗ языкового редиректа,
  // но через clerkMiddleware они уже прошли, так что currentUser() будет работать
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2. Не трогаем Next-статику и файлы с расширением
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 3. Уже есть префикс локали?
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  // 4. Добавляем локаль
  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
});

// ⚠️ /api БОЛЬШЕ НЕ ИСКЛЮЧАЕМ → они идут через Clerk
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
