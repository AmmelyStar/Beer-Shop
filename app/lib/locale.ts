// app/lib/locale.ts
export const LOCALES = ["en", "et", "fi", "uk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  et: "Eesti",
  fi: "Suomi",
  uk: "Українська",
  ru: "Русский",
};
