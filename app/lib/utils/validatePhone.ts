// app/lib/utils/validatePhone.ts

export type PhoneValidationErrorCode = "invalid" | "tooShort" | "tooLong";

export function validatePhone(raw: string): {
  error: PhoneValidationErrorCode | null;
  normalized: string;
} {
  const input = (raw || "").trim();

  // пустой — считаем допустимым (поле не обязательное)
  if (!input) {
    return { error: null, normalized: "" };
  }

  // оставляем только цифры и +
  const cleaned = input.replace(/[^\d+]/g, "");

  if (!cleaned.startsWith("+")) {
    return { error: "invalid", normalized: cleaned || input };
  }

  const digits = cleaned.slice(1).replace(/\D/g, "");

  if (digits.length < 7) {
    return { error: "tooShort", normalized: `+${digits}` };
  }

  if (digits.length > 15) {
    return { error: "tooLong", normalized: `+${digits}` };
  }

  return {
    error: null,
    normalized: `+${digits}`,
  };
}
