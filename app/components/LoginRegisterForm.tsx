// app/components/LoginRegisterForm.tsx

"use client";

import { useState, type FormEvent } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import type { Locale } from "@/app/lib/locale";
import { AuthTabs } from "@/app/components/auth/AuthTabs";
import { AuthAlert } from "@/app/components/auth/AuthAlert";
import PasswordField from "@/app/components/auth/PasswordField";
import type { AuthMessages } from "@/app/components/auth/types";

type Mode = "login" | "register";
type Strength = "weak" | "medium" | "strong";
type SupportedLocale = "en" | "ru" | "uk" | "et" | "fi";

type LocalizedAuthText = {
  incorrectCredentials: string;
  accountNotFound: string;
  emailAlreadyUsed: string;
  invalidEmail: string;
  emailRequired: string;
  passwordRequired: string;
  confirmPasswordRequired: string;
  passwordTooWeak: string;
  passwordCompromised: string;
  passwordMatchesEmail: string;
  tooManyAttempts: string;
  incorrectCode: string;
  verificationExpired: string;
  captchaFailed: string;
  alreadySignedIn: string;
  loading: string;
};

const AUTH_TEXT: Record<
  SupportedLocale,
  LocalizedAuthText
> = {
  en: {
    incorrectCredentials:
      "Incorrect email address or password.",
    accountNotFound:
      "No account was found with this email address.",
    emailAlreadyUsed:
      "This email address is already in use.",
    invalidEmail:
      "Enter a valid email address.",
    emailRequired:
      "Enter your email address.",
    passwordRequired:
      "Enter your password.",
    confirmPasswordRequired:
      "Confirm your password.",
    passwordTooWeak:
      "The password does not meet the security requirements.",
    passwordCompromised:
      "This password was found in a data breach. Choose another password.",
    passwordMatchesEmail:
      "The password must not match your email address.",
    tooManyAttempts:
      "Too many attempts. Please wait and try again.",
    incorrectCode:
      "The verification code is incorrect.",
    verificationExpired:
      "The verification link has expired. Request a new one.",
    captchaFailed:
      "Verification failed. Please complete the CAPTCHA and try again.",
    alreadySignedIn:
      "You are already signed in.",
    loading:
      "Please wait…",
  },

  ru: {
    incorrectCredentials:
      "Неверный адрес электронной почты или пароль.",
    accountNotFound:
      "Аккаунт с таким адресом электронной почты не найден.",
    emailAlreadyUsed:
      "Этот адрес электронной почты уже используется.",
    invalidEmail:
      "Введите корректный адрес электронной почты.",
    emailRequired:
      "Введите адрес электронной почты.",
    passwordRequired:
      "Введите пароль.",
    confirmPasswordRequired:
      "Подтвердите пароль.",
    passwordTooWeak:
      "Пароль не соответствует требованиям безопасности.",
    passwordCompromised:
      "Этот пароль обнаружен в утечке данных. Выберите другой пароль.",
    passwordMatchesEmail:
      "Пароль не должен совпадать с адресом электронной почты.",
    tooManyAttempts:
      "Слишком много попыток. Подождите немного и попробуйте снова.",
    incorrectCode:
      "Неверный код подтверждения.",
    verificationExpired:
      "Срок действия ссылки подтверждения истёк. Запросите новую ссылку.",
    captchaFailed:
      "Проверка не пройдена. Пройдите CAPTCHA и попробуйте снова.",
    alreadySignedIn:
      "Вы уже вошли в аккаунт.",
    loading:
      "Подождите…",
  },

  uk: {
    incorrectCredentials:
      "Неправильна електронна адреса або пароль.",
    accountNotFound:
      "Обліковий запис із такою електронною адресою не знайдено.",
    emailAlreadyUsed:
      "Ця електронна адреса вже використовується.",
    invalidEmail:
      "Введіть правильну адресу електронної пошти.",
    emailRequired:
      "Введіть адресу електронної пошти.",
    passwordRequired:
      "Введіть пароль.",
    confirmPasswordRequired:
      "Підтвердьте пароль.",
    passwordTooWeak:
      "Пароль не відповідає вимогам безпеки.",
    passwordCompromised:
      "Цей пароль було виявлено у витоку даних. Виберіть інший пароль.",
    passwordMatchesEmail:
      "Пароль не повинен збігатися з адресою електронної пошти.",
    tooManyAttempts:
      "Забагато спроб. Зачекайте трохи та спробуйте ще раз.",
    incorrectCode:
      "Неправильний код підтвердження.",
    verificationExpired:
      "Термін дії посилання для підтвердження минув. Запросіть нове.",
    captchaFailed:
      "Перевірку не пройдено. Пройдіть CAPTCHA та спробуйте ще раз.",
    alreadySignedIn:
      "Ви вже увійшли до облікового запису.",
    loading:
      "Зачекайте…",
  },

  et: {
    incorrectCredentials:
      "E-posti aadress või parool on vale.",
    accountNotFound:
      "Selle e-posti aadressiga kontot ei leitud.",
    emailAlreadyUsed:
      "See e-posti aadress on juba kasutusel.",
    invalidEmail:
      "Sisesta korrektne e-posti aadress.",
    emailRequired:
      "Sisesta oma e-posti aadress.",
    passwordRequired:
      "Sisesta parool.",
    confirmPasswordRequired:
      "Kinnita parool.",
    passwordTooWeak:
      "Parool ei vasta turvanõuetele.",
    passwordCompromised:
      "See parool on leitud andmelekkest. Vali teine parool.",
    passwordMatchesEmail:
      "Parool ei tohi olla sama mis sinu e-posti aadress.",
    tooManyAttempts:
      "Liiga palju katseid. Oota veidi ja proovi uuesti.",
    incorrectCode:
      "Kinnituskood on vale.",
    verificationExpired:
      "Kinnituslink on aegunud. Taotle uus link.",
    captchaFailed:
      "Kontroll ebaõnnestus. Läbi CAPTCHA ja proovi uuesti.",
    alreadySignedIn:
      "Oled juba sisse logitud.",
    loading:
      "Palun oota…",
  },

  fi: {
    incorrectCredentials:
      "Sähköpostiosoite tai salasana on virheellinen.",
    accountNotFound:
      "Tällä sähköpostiosoitteella ei löytynyt käyttäjätiliä.",
    emailAlreadyUsed:
      "Tämä sähköpostiosoite on jo käytössä.",
    invalidEmail:
      "Anna kelvollinen sähköpostiosoite.",
    emailRequired:
      "Anna sähköpostiosoitteesi.",
    passwordRequired:
      "Anna salasanasi.",
    confirmPasswordRequired:
      "Vahvista salasana.",
    passwordTooWeak:
      "Salasana ei täytä turvallisuusvaatimuksia.",
    passwordCompromised:
      "Tämä salasana on löytynyt tietovuodosta. Valitse toinen salasana.",
    passwordMatchesEmail:
      "Salasana ei saa olla sama kuin sähköpostiosoitteesi.",
    tooManyAttempts:
      "Liian monta yritystä. Odota hetki ja yritä uudelleen.",
    incorrectCode:
      "Vahvistuskoodi on virheellinen.",
    verificationExpired:
      "Vahvistuslinkki on vanhentunut. Pyydä uusi linkki.",
    captchaFailed:
      "Vahvistus epäonnistui. Suorita CAPTCHA ja yritä uudelleen.",
    alreadySignedIn:
      "Olet jo kirjautunut sisään.",
    loading:
      "Odota…",
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

function getAuthText(
  locale: Locale,
): LocalizedAuthText {
  return isSupportedLocale(locale)
    ? AUTH_TEXT[locale]
    : AUTH_TEXT.en;
}

function getClerkErrorCode(
  error: unknown,
): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const clerkError = error as ClerkErrorShape;

  return clerkError.errors?.[0]?.code ?? "";
}

function getLocalizedErrorMessage(
  error: unknown,
  locale: Locale,
  mode: Mode,
  fallback: string,
): string {
  const code = getClerkErrorCode(error);
  const text = getAuthText(locale);

  switch (code) {
    case "form_password_incorrect":
    case "form_password_or_identifier_incorrect":
      return text.incorrectCredentials;

    case "form_identifier_not_found":
      return text.accountNotFound;

    case "form_identifier_exists":
    case "form_already_exists":
      return text.emailAlreadyUsed;

    case "form_param_format_invalid":
    case "form_param_invalid":
    case "form_identifier_invalid":
      return text.invalidEmail;

    case "form_password_length_too_short":
    case "form_password_size_in_bytes_exceeded":
    case "form_password_validation_failed":
      return mode === "login"
        ? text.incorrectCredentials
        : text.passwordTooWeak;

    case "form_password_pwned":
    case "form_password_compromised":
      return text.passwordCompromised;

    case "form_password_matches_identifier":
      return text.passwordMatchesEmail;

    case "form_code_incorrect":
      return text.incorrectCode;

    case "verification_expired":
    case "form_code_expired":
      return text.verificationExpired;

    case "too_many_requests":
    case "rate_limit_exceeded":
    case "session_rate_limit_exceeded":
      return text.tooManyAttempts;

    case "captcha_invalid":
    case "captcha_expired":
    case "captcha_failed":
      return text.captchaFailed;

    case "session_exists":
      return text.alreadySignedIn;

    default:
      return fallback;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function getPasswordStrength(
  password: string,
): Strength | null {
  if (!password) {
    return null;
  }

  const hasLetter = /\p{L}/u.test(password);
  const hasDigit = /\p{N}/u.test(password);
  const hasSpecial =
    /[^\p{L}\p{N}]/u.test(password);

  if (
    password.length < 6 ||
    !hasLetter ||
    !hasDigit
  ) {
    return "weak";
  }

  if (
    password.length >= 10 &&
    hasLetter &&
    hasDigit &&
    hasSpecial
  ) {
    return "strong";
  }

  if (
    password.length >= 8 &&
    hasLetter &&
    hasDigit
  ) {
    return "medium";
  }

  return "weak";
}

function strengthMeta(
  strength: Strength | null,
  messages: AuthMessages,
): {
  label: string;
  className: string;
} {
  switch (strength) {
    case "weak":
      return {
        label:
          messages.passwordStrengthWeak,
        className: "text-red-500",
      };

    case "medium":
      return {
        label:
          messages.passwordStrengthMedium,
        className: "text-yellow-400",
      };

    case "strong":
      return {
        label:
          messages.passwordStrengthStrong,
        className: "text-green-500",
      };

    default:
      return {
        label: "",
        className: "",
      };
  }
}

export default function LoginRegisterForm({
  messages,
}: {
  messages: AuthMessages;
}) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const langFromParams = params?.lang;

  const lang = (
    Array.isArray(langFromParams)
      ? langFromParams[0]
      : langFromParams
  ) as Locale | undefined;

  const effectiveLang =
    (lang || "en") as Locale;

  const localizedText =
    getAuthText(effectiveLang);

  const emailVerified =
    searchParams.get("verified") === "1"
      ? messages.emailVerified
      : null;

  const emailVerificationFailed =
    searchParams.get("verification") ===
    "failed"
      ? messages.emailVerificationFailed
      : null;

  const [mode, setMode] =
    useState<Mode>("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    passwordStrength,
    setPasswordStrength,
  ] = useState<Strength | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const {
    isLoaded: signInLoaded,
    signIn,
    setActive,
  } = useSignIn();

  const {
    isLoaded: signUpLoaded,
    signUp,
  } = useSignUp();

  const {
    label: strengthLabel,
    className: strengthClass,
  } = strengthMeta(
    passwordStrength,
    messages,
  );

  function resetPasswords() {
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength(null);
    setShowPassword(false);
  }

  function clearMessages() {
    if (error) {
      setError(null);
    }

    if (success) {
      setSuccess(null);
    }
  }

  async function handleRegister() {
    if (!signUpLoaded || !signUp) {
      throw new Error(
        "Clerk sign-up is not ready",
      );
    }

    const normalizedEmail = email.trim();

    const { startEmailLinkFlow } =
      signUp.createEmailLinkFlow();

    await signUp.create({
      emailAddress: normalizedEmail,
      password,
    });

    const verificationPromise =
      startEmailLinkFlow({
        redirectUrl:
          `${window.location.origin}/${effectiveLang}/verify-email`,
      });

    setEmail(normalizedEmail);
    resetPasswords();
    setMode("login");
    setSuccess(messages.accountCreated);

    void verificationPromise.catch(
      (verificationError: unknown) => {
        setSuccess(null);

        setError(
          getLocalizedErrorMessage(
            verificationError,
            effectiveLang,
            "register",
            messages.somethingWentWrong,
          ),
        );
      },
    );
  }

  async function handleLogin() {
    if (
      !signInLoaded ||
      !signIn ||
      !setActive
    ) {
      throw new Error(
        "Clerk sign-in is not ready",
      );
    }

    const result = await signIn.create({
      identifier: email.trim(),
      password,
    });

    if (result.status !== "complete") {
      setError(
        messages.signInFlowIncomplete,
      );
      return;
    }

    await setActive({
      session: result.createdSessionId,
    });

    resetPasswords();
    router.refresh();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(
        localizedText.emailRequired,
      );
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(localizedText.invalidEmail);
      return;
    }

    if (!password) {
      setError(
        localizedText.passwordRequired,
      );
      return;
    }

    if (mode === "register") {
      if (!confirmPassword) {
        setError(
          localizedText.confirmPasswordRequired,
        );
        return;
      }

      const strength =
        getPasswordStrength(password);

      if (strength === "weak") {
        setError(messages.weakPassword);
        return;
      }

      if (password !== confirmPassword) {
        setError(
          messages.passwordsDontMatch,
        );
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (submitError: unknown) {
      setError(
        getLocalizedErrorMessage(
          submitError,
          effectiveLang,
          mode,
          messages.somethingWentWrong,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(
    nextMode: Mode,
  ) {
    setMode(nextMode);
    setError(null);
    setSuccess(null);
    resetPasswords();

    if (
      searchParams.has("verified") ||
      searchParams.has("verification")
    ) {
      router.replace(
        `/${effectiveLang}/account`,
        {
          scroll: false,
        },
      );
    }
  }

  return (
    <div className="mt-6 px-8 py-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <AuthTabs
        mode={mode}
        onChange={handleModeChange}
        signInLabel={messages.signIn}
        signUpLabel={messages.signUp}
      />

      <p className="mt-6 text-center text-base text-gray-300">
        {mode === "login"
          ? messages.welcomeBack
          : messages.createAccount}
      </p>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-6 space-y-6"
      >
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

        <PasswordField
          id="password"
          name="password"
          label={messages.password}
          value={password}
          onChange={(value) => {
            setPassword(value);

            setPasswordStrength(
              getPasswordStrength(value),
            );

            clearMessages();
          }}
          showPassword={showPassword}
          onToggleShow={() =>
            setShowPassword(
              (previous) => !previous,
            )
          }
          autoComplete={
            mode === "login"
              ? "current-password"
              : "new-password"
          }
          showPasswordLabel={
            messages.showPasswordAria
          }
          hidePasswordLabel={
            messages.hidePasswordAria
          }
          hint={
            mode === "register"
              ? messages.passwordHint
              : undefined
          }
        />

        {mode === "register" &&
          password &&
          passwordStrength && (
            <p
              className={`mt-1 text-xs font-medium ${strengthClass}`}
            >
              {messages.passwordStrength}:{" "}
              {strengthLabel}
            </p>
          )}

        {mode === "register" && (
          <PasswordField
            id="confirm-password"
            name="confirm-password"
            label={
              messages.confirmPassword
            }
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
        )}

        <AuthAlert
          error={
            error ||
            emailVerificationFailed
          }
          success={
            success || emailVerified
          }
        />

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? localizedText.loading
              : mode === "login"
                ? messages.submitSignIn
                : messages.submitSignUp}
          </button>
        </div>

        {mode === "register" && (
          <div
            id="clerk-captcha"
            className="mt-4"
          />
        )}

        {mode === "login" && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/${effectiveLang}/forgot-password`,
                )
              }
              className="text-center text-base text-gray-500 hover:text-yellow-500"
            >
              {messages.forgotPassword}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}