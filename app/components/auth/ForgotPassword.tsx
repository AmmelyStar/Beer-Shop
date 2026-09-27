// app/components/auth/ForgotPasswordForm.tsx

"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

import type { Locale } from "@/app/lib/locale";
import type { AuthMessages } from "@/app/components/auth/types";
import PasswordField from "@/app/components/auth/PasswordField";

type SupportedLocale =
  | "en"
  | "ru"
  | "uk"
  | "et"
  | "fi";

type ForgotPasswordTexts = {
  firstStepDescription: string;
  secondStepDescription: string;
  codeLabel: string;
  codePlaceholder: string;
  sendCodeButton: string;
  resetPasswordButton: string;
  changeEmailButton: string;
  loading: string;

  emailRequired: string;
  emailInvalid: string;
  accountNotFound: string;
  codeRequired: string;
  codeIncorrect: string;
  codeExpired: string;
  passwordRequired: string;
  confirmPasswordRequired: string;
  passwordTooWeak: string;
  passwordCompromised: string;
  passwordMatchesEmail: string;
  passwordsDoNotMatch: string;
  tooManyAttempts: string;
  captchaFailed: string;
  flowIncomplete: string;
};

const FORGOT_PASSWORD_TEXTS: Record<
  SupportedLocale,
  ForgotPasswordTexts
> = {
  en: {
    firstStepDescription:
      "Enter your email address to receive a password reset code.",
    secondStepDescription:
      "Enter the code from the email and choose a new password.",
    codeLabel: "Code from email",
    codePlaceholder: "Enter verification code",
    sendCodeButton: "Send reset code",
    resetPasswordButton: "Reset password",
    changeEmailButton: "Change email address",
    loading: "Please wait…",

    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address.",
    accountNotFound:
      "No account was found with this email address.",
    codeRequired:
      "Enter the verification code from the email.",
    codeIncorrect:
      "The verification code is incorrect.",
    codeExpired:
      "The verification code has expired. Request a new code.",
    passwordRequired:
      "Enter a new password.",
    confirmPasswordRequired:
      "Confirm your new password.",
    passwordTooWeak:
      "The new password does not meet the security requirements.",
    passwordCompromised:
      "This password was found in a data breach. Choose another password.",
    passwordMatchesEmail:
      "The password must not match your email address.",
    passwordsDoNotMatch:
      "The passwords do not match.",
    tooManyAttempts:
      "Too many attempts. Please wait and try again.",
    captchaFailed:
      "Verification failed. Complete the CAPTCHA and try again.",
    flowIncomplete:
      "Password reset could not be completed. Please try again.",
  },

  ru: {
    firstStepDescription:
      "Введите адрес электронной почты, чтобы получить код для сброса пароля.",
    secondStepDescription:
      "Введите код из письма и придумайте новый пароль.",
    codeLabel: "Код из письма",
    codePlaceholder: "Введите код подтверждения",
    sendCodeButton: "Отправить код",
    resetPasswordButton: "Изменить пароль",
    changeEmailButton:
      "Изменить адрес электронной почты",
    loading: "Подождите…",

    emailRequired:
      "Введите адрес электронной почты.",
    emailInvalid:
      "Введите корректный адрес электронной почты.",
    accountNotFound:
      "Аккаунт с таким адресом электронной почты не найден.",
    codeRequired:
      "Введите код подтверждения из письма.",
    codeIncorrect:
      "Неверный код подтверждения.",
    codeExpired:
      "Срок действия кода истёк. Запросите новый код.",
    passwordRequired:
      "Введите новый пароль.",
    confirmPasswordRequired:
      "Подтвердите новый пароль.",
    passwordTooWeak:
      "Новый пароль не соответствует требованиям безопасности.",
    passwordCompromised:
      "Этот пароль обнаружен в утечке данных. Выберите другой пароль.",
    passwordMatchesEmail:
      "Пароль не должен совпадать с адресом электронной почты.",
    passwordsDoNotMatch:
      "Пароли не совпадают.",
    tooManyAttempts:
      "Слишком много попыток. Подождите немного и попробуйте снова.",
    captchaFailed:
      "Проверка не пройдена. Пройдите CAPTCHA и попробуйте снова.",
    flowIncomplete:
      "Не удалось изменить пароль. Попробуйте ещё раз.",
  },

  uk: {
    firstStepDescription:
      "Введіть адресу електронної пошти, щоб отримати код для скидання пароля.",
    secondStepDescription:
      "Введіть код із листа та створіть новий пароль.",
    codeLabel: "Код із листа",
    codePlaceholder: "Введіть код підтвердження",
    sendCodeButton: "Надіслати код",
    resetPasswordButton: "Змінити пароль",
    changeEmailButton:
      "Змінити адресу електронної пошти",
    loading: "Зачекайте…",

    emailRequired:
      "Введіть адресу електронної пошти.",
    emailInvalid:
      "Введіть правильну адресу електронної пошти.",
    accountNotFound:
      "Обліковий запис із такою електронною адресою не знайдено.",
    codeRequired:
      "Введіть код підтвердження з листа.",
    codeIncorrect:
      "Неправильний код підтвердження.",
    codeExpired:
      "Термін дії коду минув. Запросіть новий код.",
    passwordRequired:
      "Введіть новий пароль.",
    confirmPasswordRequired:
      "Підтвердьте новий пароль.",
    passwordTooWeak:
      "Новий пароль не відповідає вимогам безпеки.",
    passwordCompromised:
      "Цей пароль було виявлено у витоку даних. Виберіть інший пароль.",
    passwordMatchesEmail:
      "Пароль не повинен збігатися з адресою електронної пошти.",
    passwordsDoNotMatch:
      "Паролі не збігаються.",
    tooManyAttempts:
      "Забагато спроб. Зачекайте трохи та спробуйте ще раз.",
    captchaFailed:
      "Перевірку не пройдено. Пройдіть CAPTCHA та спробуйте ще раз.",
    flowIncomplete:
      "Не вдалося змінити пароль. Спробуйте ще раз.",
  },

  et: {
    firstStepDescription:
      "Sisesta oma e-posti aadress, et saada parooli lähtestamise kood.",
    secondStepDescription:
      "Sisesta e-kirjast saadud kood ja vali uus parool.",
    codeLabel: "E-kirjaga saadetud kood",
    codePlaceholder: "Sisesta kinnituskood",
    sendCodeButton: "Saada lähtestamiskood",
    resetPasswordButton: "Muuda parooli",
    changeEmailButton: "Muuda e-posti aadressi",
    loading: "Palun oota…",

    emailRequired:
      "Sisesta oma e-posti aadress.",
    emailInvalid:
      "Sisesta korrektne e-posti aadress.",
    accountNotFound:
      "Selle e-posti aadressiga kontot ei leitud.",
    codeRequired:
      "Sisesta e-kirjaga saadetud kinnituskood.",
    codeIncorrect:
      "Kinnituskood on vale.",
    codeExpired:
      "Kinnituskood on aegunud. Taotle uus kood.",
    passwordRequired:
      "Sisesta uus parool.",
    confirmPasswordRequired:
      "Kinnita uus parool.",
    passwordTooWeak:
      "Uus parool ei vasta turvanõuetele.",
    passwordCompromised:
      "See parool on leitud andmelekkest. Vali teine parool.",
    passwordMatchesEmail:
      "Parool ei tohi olla sama mis sinu e-posti aadress.",
    passwordsDoNotMatch:
      "Paroolid ei ühti.",
    tooManyAttempts:
      "Liiga palju katseid. Oota veidi ja proovi uuesti.",
    captchaFailed:
      "Kontroll ebaõnnestus. Läbi CAPTCHA ja proovi uuesti.",
    flowIncomplete:
      "Parooli muutmine ebaõnnestus. Proovi uuesti.",
  },

  fi: {
    firstStepDescription:
      "Anna sähköpostiosoitteesi saadaksesi salasanan palautuskoodin.",
    secondStepDescription:
      "Anna sähköpostiin lähetetty koodi ja valitse uusi salasana.",
    codeLabel: "Sähköpostiin lähetetty koodi",
    codePlaceholder: "Anna vahvistuskoodi",
    sendCodeButton: "Lähetä palautuskoodi",
    resetPasswordButton: "Vaihda salasana",
    changeEmailButton: "Vaihda sähköpostiosoite",
    loading: "Odota…",

    emailRequired:
      "Anna sähköpostiosoitteesi.",
    emailInvalid:
      "Anna kelvollinen sähköpostiosoite.",
    accountNotFound:
      "Tällä sähköpostiosoitteella ei löytynyt käyttäjätiliä.",
    codeRequired:
      "Anna sähköpostiin lähetetty vahvistuskoodi.",
    codeIncorrect:
      "Vahvistuskoodi on virheellinen.",
    codeExpired:
      "Vahvistuskoodi on vanhentunut. Pyydä uusi koodi.",
    passwordRequired:
      "Anna uusi salasana.",
    confirmPasswordRequired:
      "Vahvista uusi salasana.",
    passwordTooWeak:
      "Uusi salasana ei täytä turvallisuusvaatimuksia.",
    passwordCompromised:
      "Tämä salasana on löytynyt tietovuodosta. Valitse toinen salasana.",
    passwordMatchesEmail:
      "Salasana ei saa olla sama kuin sähköpostiosoitteesi.",
    passwordsDoNotMatch:
      "Salasanat eivät täsmää.",
    tooManyAttempts:
      "Liian monta yritystä. Odota hetki ja yritä uudelleen.",
    captchaFailed:
      "Vahvistus epäonnistui. Suorita CAPTCHA ja yritä uudelleen.",
    flowIncomplete:
      "Salasanan vaihtaminen epäonnistui. Yritä uudelleen.",
  },
};

type ClerkErrorShape = {
  errors?: Array<{
    code?: string;
    message?: string;
    longMessage?: string;
  }>;
  message?: string;
};

function isSupportedLocale(
  value: string,
): value is SupportedLocale {
  return ["en", "ru", "uk", "et", "fi"].includes(
    value,
  );
}

function getTexts(
  locale: Locale,
): ForgotPasswordTexts {
  return isSupportedLocale(locale)
    ? FORGOT_PASSWORD_TEXTS[locale]
    : FORGOT_PASSWORD_TEXTS.en;
}

function getClerkErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const clerkError = error as ClerkErrorShape;

  return clerkError.errors?.[0]?.code ?? "";
}

function getLocalizedError(
  error: unknown,
  locale: Locale,
  fallback: string,
): string {
  const code = getClerkErrorCode(error);
  const texts = getTexts(locale);

  switch (code) {
    case "form_identifier_not_found":
      return texts.accountNotFound;

    case "form_identifier_invalid":
    case "form_param_format_invalid":
    case "form_param_invalid":
      return texts.emailInvalid;

    case "form_code_incorrect":
      return texts.codeIncorrect;

    case "form_code_expired":
    case "verification_expired":
      return texts.codeExpired;

    case "form_password_length_too_short":
    case "form_password_validation_failed":
    case "form_password_size_in_bytes_exceeded":
      return texts.passwordTooWeak;

    case "form_password_pwned":
    case "form_password_compromised":
      return texts.passwordCompromised;

    case "form_password_matches_identifier":
      return texts.passwordMatchesEmail;

    case "too_many_requests":
    case "rate_limit_exceeded":
    case "session_rate_limit_exceeded":
      return texts.tooManyAttempts;

    case "captcha_invalid":
    case "captcha_expired":
    case "captcha_failed":
      return texts.captchaFailed;

    default:
      return fallback;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongEnoughPassword(
  value: string,
): boolean {
  const hasLetter = /\p{L}/u.test(value);
  const hasNumber = /\p{N}/u.test(value);

  return (
    value.length >= 8 &&
    hasLetter &&
    hasNumber
  );
}

export default function ForgotPasswordForm({
  messages,
}: {
  messages: AuthMessages;
}) {
  const router = useRouter();
  const params = useParams();

  const {
    isLoaded,
    signIn,
    setActive,
  } = useSignIn();

  const langFromParams = params?.lang;

  const lang = (
    Array.isArray(langFromParams)
      ? langFromParams[0]
      : langFromParams
  ) as Locale | undefined;

  const effectiveLang = (lang || "en") as Locale;
  const texts = getTexts(effectiveLang);

  const [stepSent, setStepSent] =
    useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  if (!isLoaded) {
    return null;
  }

  async function handleSendCode(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(texts.emailRequired);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(texts.emailInvalid);
      return;
    }

    if (!signIn) {
      setError(messages.somethingWentWrong);
      return;
    }

    setLoading(true);

    try {
      await signIn.create({
        strategy:
          "reset_password_email_code",
        identifier: normalizedEmail,
      });

      setEmail(normalizedEmail);
      setStepSent(true);
      setSuccess(messages.resetSent);
    } catch (sendError: unknown) {
      setError(
        getLocalizedError(
          sendError,
          effectiveLang,
          messages.somethingWentWrong,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setError(texts.codeRequired);
      return;
    }

    if (!password) {
      setError(texts.passwordRequired);
      return;
    }

    if (!confirmPassword) {
      setError(
        texts.confirmPasswordRequired,
      );
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      setError(messages.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(messages.passwordsDontMatch);
      return;
    }

    if (!signIn) {
      setError(messages.somethingWentWrong);
      return;
    }

    setLoading(true);

    try {
      const result =
        await signIn.attemptFirstFactor({
          strategy:
            "reset_password_email_code",
          code: normalizedCode,
          password,
        });

      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive?.({
            session: result.createdSessionId,
          });
        }

        router.replace(
          `/${effectiveLang}/account`,
        );

        router.refresh();
        return;
      }

      setError(texts.flowIncomplete);
    } catch (resetError: unknown) {
      setError(
        getLocalizedError(
          resetError,
          effectiveLang,
          messages.somethingWentWrong,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChangeEmail() {
    setStepSent(false);
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setError(null);
    setSuccess(null);
  }

  function clearMessages() {
    if (error) {
      setError(null);
    }

    if (success) {
      setSuccess(null);
    }
  }

  return (
    <div className="mt-6 px-8 py-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <p className="mb-4 text-base text-gray-300">
        {!stepSent
          ? messages.forgotPasswordDescription ||
            texts.firstStepDescription
          : messages.resetPasswordDescription ||
            texts.secondStepDescription}
      </p>

      <form
        noValidate
        onSubmit={
          stepSent
            ? handleReset
            : handleSendCode
        }
        className="space-y-6"
      >
        {!stepSent && (
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-300"
            >
              {messages.email}
            </label>

            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearMessages();
                }}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>
        )}

        {stepSent && (
          <>
            <div>
              <label
                htmlFor="code"
                className="block text-sm/6 font-medium text-gray-300"
              >
                {texts.codeLabel}
              </label>

              <div className="mt-2">
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  required
                  autoComplete="one-time-code"
                  value={code}
                  placeholder={
                    texts.codePlaceholder
                  }
                  onChange={(event) => {
                    setCode(event.target.value);
                    clearMessages();
                  }}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <PasswordField
              id="new-password"
              name="new-password"
              label={messages.password}
              value={password}
              onChange={(value) => {
                setPassword(value);
                clearMessages();
              }}
              showPassword={showPassword}
              onToggleShow={() =>
                setShowPassword(
                  (previous) => !previous,
                )
              }
              autoComplete="new-password"
              showPasswordLabel={
                messages.showPasswordAria
              }
              hidePasswordLabel={
                messages.hidePasswordAria
              }
              hint={messages.passwordHint}
            />

            <PasswordField
              id="confirm-new-password"
              name="confirm-new-password"
              label={messages.confirmPassword}
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                clearMessages();
              }}
              showPassword={showPassword}
              onToggleShow={() =>
                setShowPassword(
                  (previous) => !previous,
                )
              }
              autoComplete="new-password"
              showPasswordLabel={
                messages.showPasswordAria
              }
              hidePasswordLabel={
                messages.hidePasswordAria
              }
            />
          </>
        )}

        {error && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-red-500"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-green-500"
          >
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? texts.loading
            : stepSent
              ? messages.resetPasswordButton ||
                texts.resetPasswordButton
              : messages.sendResetCodeButton ||
                texts.sendCodeButton}
        </button>

        {stepSent && (
          <button
            type="button"
            onClick={handleChangeEmail}
            disabled={loading}
            className="w-full text-center text-sm text-gray-400 transition-colors hover:text-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {texts.changeEmailButton}
          </button>
        )}
      </form>
    </div>
  );
}