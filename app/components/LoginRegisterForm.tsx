// app\components\LoginRegisterForm.tsx

"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import type { Locale } from "@/app/lib/locale";

import { AuthTabs } from "@/app/components/auth/AuthTabs";
import { AuthAlert } from "@/app/components/auth/AuthAlert";
import PasswordField from "@/app/components/auth/PasswordField";
import type { AuthMessages } from "@/app/components/auth/types";

type Strength = "weak" | "medium" | "strong";

function getPasswordStrength(pw: string): Strength | null {
  if (!pw) return null;

  const hasLetter = /[A-Za-zА-Яа-я]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-zА-Яа-я0-9]/.test(pw);

  if (pw.length < 6 || !hasLetter || !hasDigit) return "weak";
  if (pw.length >= 10 && hasLetter && hasDigit && hasSpecial) return "strong";
  if (pw.length >= 8 && hasLetter && hasDigit) return "medium";

  return "weak";
}

function strengthMeta(
  strength: Strength | null,
  messages: AuthMessages
): { label: string; className: string } {
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
      return { label: "", className: "" };
  }
}

// аккуратный тип под ошибки Clerk
type ClerkErrorShape = {
  errors?: { longMessage?: string; message?: string }[];
  message?: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as ClerkErrorShape;
  return (
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    e?.message ||
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

  // забираем lang из URL, на всякий случай приводим к строке и подстраховываемся
  const langFromParams = params?.lang;
  const lang = (
    Array.isArray(langFromParams) ? langFromParams[0] : langFromParams
  ) as Locale | undefined;

  const effectiveLang = (lang || "en") as Locale;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<Strength | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();

  const { label: strengthLabel, className: strengthClass } = strengthMeta(
    passwordStrength,
    messages
  );

  function resetPasswords() {
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength(null);
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "register") {
        const strength = getPasswordStrength(password);
        if (strength === "weak") {
          setError(messages.weakPassword);
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError(messages.passwordsDontMatch);
          setLoading(false);
          return;
        }

        if (!signUpLoaded || !signUp || !setActive) {
          setLoading(false);
          return;
        }

        const result = await signUp.create({
          emailAddress: email,
          password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          resetPasswords();
          setSuccess(messages.accountCreated);

          setTimeout(() => {
            router.push(`/${effectiveLang}/account`);
            router.refresh();
          }, 500);
        } else {
          setError(messages.signUpFlowIncomplete);
        }
      } else {
        // LOGIN
        if (!signInLoaded || !signIn || !setActive) {
          setLoading(false);
          return;
        }

        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          resetPasswords();

          // просто перерисовываем текущую страницу с новым auth-состоянием
          router.refresh();
        } else {
          setError(messages.signInFlowIncomplete);
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, messages.somethingWentWrong));
    } finally {
      setLoading(false);
    }
  }

  // async function handleForgotPassword() {
  //   setError(null);
  //   setSuccess(null);

  //   if (!email) {
  //     setError(messages.enterEmailFirst);
  //     return;
  //   }

  //   if (!signInLoaded || !signIn) return;

  //   try {
  //     await signIn.create({
  //       strategy: "reset_password_email_code",
  //       identifier: email,
  //     });

  //     setSuccess(messages.resetSent);
  //   } catch (err: unknown) {
  //     setError(getErrorMessage(err, messages.somethingWentWrong));
  //   }
  // }

  return (
    <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[480px] px-8 py-10">
      <AuthTabs
        mode={mode}
        onChange={(nextMode: "login" | "register") => {
          setMode(nextMode);
          setError(null);
          setSuccess(null);
          resetPasswords();
        }}
        signInLabel={messages.signIn}
        signUpLabel={messages.signUp}
      />

      <p className="mt-6 text-center text-base text-gray-300">
        {mode === "login" ? messages.welcomeBack : messages.createAccount}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Email */}
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
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordField
          id="password"
          name="password"
          label={messages.password}
          value={password}
          onChange={(v) => {
            setPassword(v);
            setPasswordStrength(getPasswordStrength(v));
          }}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword((prev) => !prev)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          showPasswordLabel={messages.showPasswordAria}
          hidePasswordLabel={messages.hidePasswordAria}
          hint={mode === "register" ? messages.passwordHint : undefined}
        />

        {mode === "register" && password && passwordStrength && (
          <p className={`mt-1 text-xs font-medium ${strengthClass}`}>
            {messages.passwordStrength}: {strengthLabel}
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
            onToggleShow={() => setShowPassword((prev) => !prev)}
            autoComplete="new-password"
            showPasswordLabel={messages.showPasswordAria}
            hidePasswordLabel={messages.hidePasswordAria}
          />
        )}

        <AuthAlert error={error} success={success} />

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "..."
              : mode === "login"
              ? messages.submitSignIn
              : messages.submitSignUp}
          </button>
        </div>

        {mode === "register" && <div id="clerk-captcha" className="mt-4" />}

        {mode === "login" && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => router.push(`/${effectiveLang}/forgot-password`)}
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
