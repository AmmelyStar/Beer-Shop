// proxy.ts (ROOT)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const locales = [
  "en",
  "et",
  "fi",
  "uk",
  "ru",
] as const;

const defaultLocale = "et";

export const proxy = clerkMiddleware(
  (
    auth,
    request: NextRequest,
  ) => {
    // Clerk middleware должен обработать запрос,
    // поэтому сохраняем параметр auth.
    void auth;

    const { pathname } =
      request.nextUrl;

    // API-запросы не перенаправляем
    if (
      pathname.startsWith("/api")
    ) {
      return NextResponse.next();
    }

    // Не перенаправляем Next.js-файлы
    // и файлы с расширением
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith(
        "/favicon",
      ) ||
      /\.[^/]+$/.test(pathname)
    ) {
      return NextResponse.next();
    }

    // Проверяем, указан ли язык
    // в текущем адресе
    const hasLocale =
      locales.some(
        (locale) =>
          pathname ===
            `/${locale}` ||
          pathname.startsWith(
            `/${locale}/`,
          ),
      );

    // Если язык уже указан,
    // ничего не меняем
    if (hasLocale) {
      return NextResponse.next();
    }

    // Если языка в адресе нет,
    // открываем эстонскую версию
    const url =
      request.nextUrl.clone();

    url.pathname =
      pathname === "/"
        ? `/${defaultLocale}`
        : `/${defaultLocale}${pathname}`;

    return NextResponse.redirect(
      url,
    );
  },
);

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};