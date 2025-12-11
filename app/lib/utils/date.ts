// app/lib/utils/date.ts

export function normalizeBirthday(value?: string): string {
  if (!value) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";

  const year = Number(match[1]);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) return "";

  return value;
}
