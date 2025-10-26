// next-intl.config.ts
import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'et', 'ru', 'fi'] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const safeLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : 'en';

  // 👇 путь к JSON именно ./locales
  const messages = (await import(`./locales/${safeLocale}.json`)).default;

  return { locale: safeLocale, messages };
});
