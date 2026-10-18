"use client";

import {
  Suspense,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import type { Locale } from "@/app/lib/locale";

type PartnershipTranslations = {
  title: string;
  subtitle: string;
  imageAlt?: string;

  form: {
    firstname: string;
    lastname: string;
    emailLabel: string;
    company: string;
    phone: string;
    optional: string;
    message: string;
    messageLimit: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };

  validation: {
    firstNameRequired: string;
    firstNameMin: string;
    lastNameRequired: string;
    lastNameMin: string;
    lettersOnly: string;
    emailRequired: string;
    emailInvalid: string;
    emailDisposable: string;
    messageRequired: string;
    messageMin: string;
    messageMax: string;
    phoneInvalid: string;
    phoneMin: string;
    phoneMax: string;
  };
};

type Props = {
  lang: Locale;
  t: PartnershipTranslations;
  contentHtml?: string | null;

  // Компактная версия для главной страницы
  compact?: boolean;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  message: string;
};

type FormErrors = Partial<
  Record<keyof FormData, string>
>;

const EMPTY_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  phone: "",
  message: "",
};

const DISPOSABLE_EMAILS = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
];

function PartnershipInner({
  lang,
  t,
  contentHtml,
  compact = false,
}: Props) {
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "1";

  const [formData, setFormData] =
    useState<FormData>(EMPTY_FORM);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitStatus, setSubmitStatus] =
    useState<"success" | "error" | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const nameRegex = /^[\p{L}\s'-]+$/u;

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();
    const phone = formData.phone.trim();

    if (!firstName) {
      newErrors.firstName =
        t.validation.firstNameRequired;
    } else if (firstName.length < 2) {
      newErrors.firstName =
        t.validation.firstNameMin;
    } else if (!nameRegex.test(firstName)) {
      newErrors.firstName =
        t.validation.lettersOnly;
    }

    if (!lastName) {
      newErrors.lastName =
        t.validation.lastNameRequired;
    } else if (lastName.length < 2) {
      newErrors.lastName =
        t.validation.lastNameMin;
    } else if (!nameRegex.test(lastName)) {
      newErrors.lastName =
        t.validation.lettersOnly;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email =
        t.validation.emailRequired;
    } else if (!emailRegex.test(email)) {
      newErrors.email =
        t.validation.emailInvalid;
    } else {
      const domain =
        email.split("@")[1]?.toLowerCase();

      if (
        domain &&
        DISPOSABLE_EMAILS.includes(domain)
      ) {
        newErrors.email =
          t.validation.emailDisposable;
      }
    }

    if (!message) {
      newErrors.message =
        t.validation.messageRequired;
    } else if (message.length < 10) {
      newErrors.message =
        t.validation.messageMin;
    } else if (message.length > 500) {
      newErrors.message =
        t.validation.messageMax;
    }

    if (phone) {
      const phoneRegex = /^[\d\s+()-]+$/;

      if (!phoneRegex.test(phone)) {
        newErrors.phone =
          t.validation.phoneInvalid;
      } else {
        const digitsOnly =
          phone.replace(/\D/g, "");

        if (digitsOnly.length < 7) {
          newErrors.phone =
            t.validation.phoneMin;
        } else if (digitsOnly.length > 15) {
          newErrors.phone =
            t.validation.phoneMax;
        }
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    const fieldName = name as keyof FormData;

    if (errors[fieldName]) {
      setErrors((previous) => ({
        ...previous,
        [fieldName]: undefined,
      }));
    }

    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSubmitStatus(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          lang,
          source: compact
            ? "home-partnership"
            : "partnership",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send message: ${response.status}`,
        );
      }

      setSubmitStatus("success");
      setFormData(EMPTY_FORM);
      setErrors({});
    } catch (error: unknown) {
      console.error(
        "Error sending partnership message:",
        error instanceof Error
          ? error.message
          : String(error),
      );

      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = (
    hasError: boolean,
  ) =>
    [
      "w-full border-b bg-transparent pb-2",
      "text-white outline-none",
      "transition-colors",
      hasError
        ? "border-red-500"
        : "border-gray-400/50 focus:border-yellow-400",
    ].join(" ");

  const outerClassName = compact
    ? "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    : "relative mx-auto mb-24 mt-2 max-w-7xl overflow-hidden";

  const wrapperClassName = compact
    ? "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/20 lg:grid lg:grid-cols-[1.1fr_0.9fr]"
    : "overflow-hidden lg:grid lg:grid-cols-2";

  const contentClassName = compact
    ? "px-6 py-10 sm:px-8 lg:px-10 lg:py-12"
    : "px-6 py-12 sm:py-20";

  const imageClassName = compact
    ? "relative order-first h-64 sm:h-80 lg:order-none lg:h-auto lg:min-h-[680px]"
    : "relative order-first h-64 sm:h-80 lg:order-none lg:h-auto lg:min-h-[850px]";

  return (
    <section
      id={compact ? "partnership" : undefined}
      className={outerClassName}
    >
      <div className={wrapperClassName}>
        <div className={contentClassName}>
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
            {compact ? (
              <h2 className="text-pretty text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {t.title}
              </h2>
            ) : (
              <h1 className="text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {t.title}
              </h1>
            )}

            {contentHtml ? (
              <div
                className={[
                  "max-w-lg border-l-2 border-yellow-400 py-1 pl-5",
                  "text-neutral-300",
                  compact
                    ? "mt-5 text-sm leading-6 sm:text-base sm:leading-7"
                    : "mt-7 text-base leading-7",
                  "[&_p]:m-0 [&_p+p]:mt-4",
                  "[&_strong]:font-semibold [&_strong]:text-white",
                  "[&_a]:text-yellow-400 [&_a]:underline",
                  "[&_a]:underline-offset-4",
                  "[&_a:hover]:text-yellow-300",
                ].join(" ")}
                dangerouslySetInnerHTML={{
                  __html: contentHtml,
                }}
              />
            ) : (
              <p
                className={[
                  "max-w-lg border-l-2 border-yellow-400 py-1 pl-5 text-neutral-300",
                  compact
                    ? "mt-5 text-sm leading-6 sm:text-base sm:leading-7"
                    : "mt-7 text-base leading-7",
                ].join(" ")}
              >
                {t.subtitle}
              </p>
            )}

            {sent ? (
              <div
                className="mt-6 rounded-md border border-green-500/50 bg-green-500/10 p-4"
                role="status"
              >
                <p className="text-sm text-green-400">
                  {t.form.success}
                </p>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className={compact ? "mt-8" : "mt-12"}
              noValidate
            >
              <div
                className={[
                  "grid grid-cols-1 gap-x-8 sm:grid-cols-2",
                  compact ? "gap-y-6" : "gap-y-8",
                ].join(" ")}
              >
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-sm tracking-wide text-gray-400"
                  >
                    {t.form.firstname}
                  </label>

                  <div className="mt-2">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleChange}
                      aria-invalid={Boolean(
                        errors.firstName,
                      )}
                      aria-describedby={
                        errors.firstName
                          ? "firstName-error"
                          : undefined
                      }
                      className={inputClassName(
                        Boolean(errors.firstName),
                      )}
                    />

                    {errors.firstName ? (
                      <p
                        id="firstName-error"
                        className="mt-1 text-sm text-red-400"
                      >
                        {errors.firstName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="text-sm tracking-wide text-gray-400"
                  >
                    {t.form.lastname}
                  </label>

                  <div className="mt-2">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleChange}
                      aria-invalid={Boolean(
                        errors.lastName,
                      )}
                      aria-describedby={
                        errors.lastName
                          ? "lastName-error"
                          : undefined
                      }
                      className={inputClassName(
                        Boolean(errors.lastName),
                      )}
                    />

                    {errors.lastName ? (
                      <p
                        id="lastName-error"
                        className="mt-1 text-sm text-red-400"
                      >
                        {errors.lastName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="text-sm tracking-wide text-gray-400"
                  >
                    {t.form.emailLabel}
                  </label>

                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={Boolean(
                        errors.email,
                      )}
                      aria-describedby={
                        errors.email
                          ? "email-error"
                          : undefined
                      }
                      className={inputClassName(
                        Boolean(errors.email),
                      )}
                    />

                    {errors.email ? (
                      <p
                        id="email-error"
                        className="mt-1 text-sm text-red-400"
                      >
                        {errors.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="company"
                    className="text-sm tracking-wide text-gray-400"
                  >
                    {t.form.company}
                  </label>

                  <div className="mt-2">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={formData.company}
                      onChange={handleChange}
                      className={inputClassName(false)}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between gap-4">
                    <label
                      htmlFor="phone"
                      className="text-sm tracking-wide text-gray-400"
                    >
                      {t.form.phone}
                    </label>

                    <span
                      id="phone-description"
                      className="text-xs text-gray-500"
                    >
                      {t.form.optional}
                    </span>
                  </div>

                  <div className="mt-2">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      aria-invalid={Boolean(
                        errors.phone,
                      )}
                      aria-describedby={
                        errors.phone
                          ? "phone-description phone-error"
                          : "phone-description"
                      }
                      className={inputClassName(
                        Boolean(errors.phone),
                      )}
                    />

                    {errors.phone ? (
                      <p
                        id="phone-error"
                        className="mt-1 text-sm text-red-400"
                      >
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between gap-4">
                    <label
                      htmlFor="message"
                      className="text-sm tracking-wide text-gray-400"
                    >
                      {t.form.message}
                    </label>

                    <span
                      id="message-description"
                      className="text-xs text-gray-500"
                    >
                      {t.form.messageLimit}
                    </span>
                  </div>

                  <div className="mt-2">
                    <textarea
                      id="message"
                      name="message"
                      rows={compact ? 4 : 6}
                      maxLength={500}
                      value={formData.message}
                      onChange={handleChange}
                      aria-invalid={Boolean(
                        errors.message,
                      )}
                      aria-describedby={
                        errors.message
                          ? "message-description message-error"
                          : "message-description"
                      }
                      className={[
                        "w-full rounded-md border",
                        "bg-black/20 px-3 py-2",
                        "text-sm text-white outline-none",
                        "transition-colors",
                        "placeholder:text-gray-500",
                        errors.message
                          ? "border-red-500"
                          : "border-gray-400/40 focus:border-yellow-400",
                      ].join(" ")}
                    />

                    <div className="mt-1 flex justify-between gap-4">
                      {errors.message ? (
                        <p
                          id="message-error"
                          className="text-sm text-red-400"
                        >
                          {errors.message}
                        </p>
                      ) : (
                        <span />
                      )}

                      <span className="text-xs text-gray-500">
                        {formData.message.length}/500
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={compact ? "mt-7" : "mt-10"}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-md border border-yellow-500 bg-yellow-500 px-8 py-3 text-sm font-semibold text-black transition-colors duration-300 hover:border-yellow-400 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? t.form.submitting
                    : t.form.submit}
                </button>
              </div>

              {submitStatus === "success" ? (
                <div
                  className="mt-6 rounded-md border border-green-500/50 bg-green-500/10 p-4"
                  role="status"
                >
                  <p className="text-sm text-green-400">
                    {t.form.success}
                  </p>
                </div>
              ) : null}

              {submitStatus === "error" ? (
                <div
                  className="mt-6 rounded-md border border-red-500/50 bg-red-500/10 p-4"
                  role="alert"
                >
                  <p className="text-sm text-red-400">
                    {t.form.error}
                  </p>
                </div>
              ) : null}
            </form>
          </div>
        </div>

        <div className={imageClassName}>
          <Image
            fill
            sizes={
              compact
                ? "(max-width: 1024px) 100vw, 40vw"
                : "(max-width: 1024px) 100vw, 50vw"
            }
            alt={t.imageAlt ?? t.title}
            src="/category/fresh-light-beer-mug.jpg"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default function PartnershipClient(
  props: Props,
) {
  return (
    <Suspense fallback={null}>
      <PartnershipInner {...props} />
    </Suspense>
  );
}