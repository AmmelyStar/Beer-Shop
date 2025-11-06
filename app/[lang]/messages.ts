// app/[lang]/messages.ts

// 1) Локали
export const LOCALES = ["en", "et", "fi", "uk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

// 2) Эталонная структура по en.json
import en from "../messages/en.json";
import et from "../messages/et.json";
import fi from "../messages/fi.json";
import uk from "../messages/uk.json";
import ru from "../messages/ru.json";

export type AllMessages = typeof en;

// Разрешаем неполные словари для локалей
const DICTS: Record<Locale, Partial<AllMessages>> = {
  en,
  et,
  fi,
  uk,
  ru,
};

// 3) Типобезопасный deepMerge ТОЛЬКО для plain-objects
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  patch?: DeepPartial<T>
): T {
  if (!patch) return base;
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(patch as Record<string, unknown>)) {
    const k = key as keyof T;
    const pv = (patch as Record<string, unknown>)[key];
    if (pv === undefined) continue;

    const bv = base[k];

    if (isPlainObject(bv) && isPlainObject(pv)) {
      (result as T)[k] = deepMerge(
        bv as Record<string, unknown>,
        pv as DeepPartial<Record<string, unknown>>
      ) as unknown as T[typeof k];
    } else {
      (result as T)[k] = pv as T[typeof k];
    }
  }

  return result as T;
}

// 4) Публичная функция
export async function getMessages(lang: Locale): Promise<AllMessages> {
  // Мержим выбранный словарь поверх en → гарантированно полный объект
  return deepMerge<AllMessages>(en as AllMessages, DICTS[lang] as DeepPartial<AllMessages>);
}
