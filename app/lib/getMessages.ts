import type { Locale } from "@/app/lib/locale";

export async function getMessages(lang: Locale) {
  switch (lang) {
    case "ru":
      return (await import("@/app/messages/ru.json")).default;
    case "uk":
      return (await import("@/app/messages/uk.json")).default;
    case "et":
      return (await import("@/app/messages/et.json")).default;
    case "fi":
      return (await import("@/app/messages/fi.json")).default;
    default:
      return (await import("@/app/messages/en.json")).default;
  }
}
