// next-intl.config.ts
import { getRequestConfig } from "next-intl/server";

// Список поддерживаемых локалей
const locales = ["en", "et", "ru", "fi", "uk"] as const;
type Locale = (typeof locales)[number];

// Тип контекста, который приходит в getRequestConfig
type RequestContext = {
  locale?: string;
};

export default getRequestConfig(async ({ locale }: RequestContext) => {
  // Если locale не пришла (undefined) или она не из разрешённых,
  // мы жёстко ставим 'en' как дефолт.
  const fallback: Locale = "en";

  const safeLocale: Locale = locale && locales.includes(locale as Locale)
    ? (locale as Locale)
    : fallback;

  // Динамически берём переводы
  const messages = (
    await import(`./locales/${safeLocale}.json`)
  ).default;

  return {
    locale: safeLocale,
    messages,
  };
});