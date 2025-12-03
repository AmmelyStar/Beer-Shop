// app/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import type { Locale } from "@/app/lib/locale";
import type { AuthMessages } from "@/app/components/auth/types";
import PasswordField from "@/app/components/auth/PasswordField";

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

export default function ForgotPasswordForm({
  messages,
}: {
  messages: AuthMessages;
}) {
  const router = useRouter();
  const params = useParams();
  const { isLoaded, signIn, setActive } = useSignIn();

  const langFromParams = params?.lang;
  const lang = (
    Array.isArray(langFromParams) ? langFromParams[0] : langFromParams
  ) as Locale | undefined;
  const effectiveLang = (lang || "en") as Locale;

  const [stepSent, setStepSent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return null;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError(messages.enterEmailFirst);
      return;
    }

    if (!signIn) return;

    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setStepSent(true);
      setSuccess(messages.resetSent);
    } catch (err) {
      setError(getErrorMessage(err, messages.somethingWentWrong));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!signIn) return;

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      // На всякий случай посмотрим, что реально вернулось от Clerk
      console.log("reset result", result);

      if (result.status === "complete") {
        // пароль успешно обновлён, Clerk создаёт новую сессию
        await setActive?.({ session: result.createdSessionId });
        router.push(`/${effectiveLang}/account`);
        // refresh тут уже не нужен — мы и так ушли на другую страницу
        return;
      }

      if (result.status === "needs_second_factor") {
        // если когда-нибудь включишь 2FA — сюда придёшь
        setError(messages.signInFlowIncomplete);
        return;
      }

      // Любой другой странный статус — тоже подсветим
      setError(messages.signInFlowIncomplete);
    } catch (err) {
      // сюда попадём, если код не подошёл, истёк, слишком много попыток и т.п.
      setError(getErrorMessage(err, messages.somethingWentWrong));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[480px] px-8 py-10">
      <p className="text-base text-gray-300 mb-4">
        {!stepSent
          ? messages.forgotPasswordDescription ??
            "Enter your email to receive a reset code."
          : messages.resetPasswordDescription ??
            "Enter the code from the email and your new password."}
      </p>

      <form
        onSubmit={stepSent ? handleReset : handleSendCode}
        className="space-y-6"
      >
        {/* Шаг 1 — email */}
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
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>
        )}

        {/* Шаг 2 — код + новый пароль */}
        {stepSent && (
          <>
            <div>
              <label
                htmlFor="code"
                className="block text-sm/6 font-medium text-gray-300"
              >
                Code from email
              </label>
              <div className="mt-2">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <PasswordField
              id="new-password"
              name="new-password"
              label={messages.password}
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((prev) => !prev)}
              autoComplete="new-password"
              showPasswordLabel={messages.showPasswordAria}
              hidePasswordLabel={messages.hidePasswordAria}
            />
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md border border-white/10 bg-white/10 px-8 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "..."
              : stepSent
              ? messages.resetPasswordButton ?? "Reset password"
              : messages.sendResetCodeButton ?? "Send reset code"}
          </button>
        </div>
      </form>
    </div>
  );
}
