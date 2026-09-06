// app/components/LoginRegisterForm.tsx

"use client";

import { useState } from "react";
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

type Strength = "weak" | "medium" | "strong";

function getPasswordStrength(
  password: string,
): Strength | null {
  if (!password) {
    return null;
  }

  const hasLetter = /[A-Za-zА-Яа-я]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial =
    /[^A-Za-zА-Яа-я0-9]/.test(password);

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
        label: messages.passwordStrengthWeak,
        className: "text-red-500",
      };

    case "medium":
      return {
        label: messages.passwordStrengthMedium,
        className: "text-yellow-400",
      };

    case "strong":
      return {
        label: messages.passwordStrengthStrong,
        className: "text-green-500",
      };

    default:
      return {
        label: "",
        className: "",
      };
  }
}

type ClerkErrorShape = {
  errors?: {
    longMessage?: string;
    message?: string;
  }[];
  message?: string;
};

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const clerkError = error as ClerkErrorShape;

  return (
    clerkError?.errors?.[0]?.longMessage ||
    clerkError?.errors?.[0]?.message ||
    clerkError?.message ||
    fallback
  );
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

  const effectiveLang = (lang || "en") as Locale;

  const emailVerified =
    searchParams.get("verified") === "1"
      ? messages.emailVerified
      : null;

  const emailVerificationFailed =
    searchParams.get("verification") === "failed"
      ? messages.emailVerificationFailed
      : null;

  const [mode, setMode] = useState<
    "login" | "register"
  >("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [
    passwordStrength,
    setPasswordStrength,
  ] = useState<Strength | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  } = strengthMeta(passwordStrength, messages);

  function resetPasswords() {
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength(null);
    setShowPassword(false);
  }

  async function handleRegister() {
    const strength =
      getPasswordStrength(password);

    if (strength === "weak") {
      setError(messages.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(messages.passwordsDontMatch);
      return;
    }

    if (!signUpLoaded || !signUp) {
      return;
    }

    const { startEmailLinkFlow } =
      signUp.createEmailLinkFlow();

    await signUp.create({
      emailAddress: email,
      password,
    });

    const verificationPromise =
      startEmailLinkFlow({
        redirectUrl: `${window.location.origin}/${effectiveLang}/verify-email`,
      });

    resetPasswords();
    setMode("login");
    setSuccess(messages.accountCreated);

    void verificationPromise.catch(
      (verificationError: unknown) => {
        setSuccess(null);

        setError(
          getErrorMessage(
            verificationError,
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
      return;
    }

    const result = await signIn.create({
      identifier: email,
      password,
    });

    if (result.status !== "complete") {
      setError(messages.signInFlowIncomplete);
      return;
    }

    await setActive({
      session: result.createdSessionId,
    });

    resetPasswords();
    router.refresh();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (submitError: unknown) {
      setError(
        getErrorMessage(
          submitError,
          messages.somethingWentWrong,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(
    nextMode: "login" | "register",
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
        `/${effectiveLang}/login`,
        { scroll: false },
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
              onChange={(event) =>
                setEmail(event.target.value)
              }
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
            label={messages.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
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
            error || emailVerificationFailed
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
              ? "..."
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