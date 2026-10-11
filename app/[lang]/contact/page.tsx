// app/[lang]/contact/page.tsx

import { fetchPageByHandle } from "@/app/data/repo";
import { notFound } from "next/navigation";

import type { Locale } from "@/app/lib/locale";
import { LegalPageLayout } from "@/app/components/LegalPageLayout";

type ContactPageProps = {
  params: Promise<{
    lang: Locale;
  }>;
};

const STORE_SECTION_LABELS = [
  "Physical stores",
  "Физические магазины",
  "Фізичні магазини",
  "Füüsilised kauplused",
  "Myymälät",
] as const;

const MAP_BUTTON_LABELS: Record<Locale, string> = {
  en: "View on Google Maps",
  ru: "Посмотреть на Google Картах",
  uk: "Переглянути на Google Картах",
  et: "Vaata Google Mapsis",
  fi: "Näytä Google Mapsissa",
};

function escapeRegExp(value: string): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeAddress(value: string): boolean {
  if (!value) {
    return false;
  }

  /*
   * У адреса должна быть хотя бы одна цифра.
   * Электронную почту адресом магазина
   * не считаем.
   */
  return (
    value.length >= 6 &&
    /\d/.test(value) &&
    !value.includes("@")
  );
}

function addGoogleMapsButtons(
  html: string,
  lang: Locale,
): string {
  if (!html) {
    return html;
  }

  const sectionLabelsPattern =
    STORE_SECTION_LABELS
      .map(escapeRegExp)
      .join("|");

  /*
   * Ищем начало раздела физических
   * магазинов на любом языке.
   */
  const sectionRegex = new RegExp(
    `(?:${sectionLabelsPattern})\\s*:?\s*`,
    "i",
  );

  const sectionMatch =
    sectionRegex.exec(html);

  if (!sectionMatch) {
    return html;
  }

  const sectionEndIndex =
    sectionMatch.index +
    sectionMatch[0].length;

  const beforeStoreSection =
    html.slice(0, sectionEndIndex);

  const storeSection =
    html.slice(sectionEndIndex);

  const buttonLabel =
    MAP_BUTTON_LABELS[lang] ??
    MAP_BUTTON_LABELS.en;

  /*
   * Каждый адрес, добавленный в Shopify
   * отдельным абзацем, получает свою
   * кнопку Google Maps.
   */
  const storeSectionWithButtons =
    storeSection.replace(
      /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
      (
        originalParagraph: string,
        paragraphContent: string,
      ) => {
        const address =
          decodeHtmlText(
            paragraphContent,
          );

        if (
          !looksLikeAddress(address)
        ) {
          return originalParagraph;
        }

        const googleMapsUrl =
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            address,
          )}`;

        return `
          <div class="not-prose my-5 flex flex-col gap-4 rounded-lg border border-neutral-700 bg-neutral-900/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-base leading-7 text-gray-300">
              ${paragraphContent}
            </div>

            <a
              href="${googleMapsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex shrink-0 items-center justify-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold !text-black transition-colors hover:bg-yellow-400 hover:!text-black"
              aria-label="${buttonLabel}: ${address}"
            >
              ${buttonLabel}
            </a>
          </div>
        `;
      },
    );

  return (
    beforeStoreSection +
    storeSectionWithButtons
  );
}

export default async function ContactPage({
  params,
}: ContactPageProps) {
  const { lang } = await params;

  const page =
    await fetchPageByHandle(
      "contact-1",
      lang,
    );

  if (!page) {
    notFound();
  }

  const htmlWithMapButtons =
    addGoogleMapsButtons(
      page.body,
      lang,
    );

  return (
    <main>
      <LegalPageLayout
        title={page.title}
        html={htmlWithMapButtons}
      />
    </main>
  );
}