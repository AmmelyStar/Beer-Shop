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
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

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

function PartnershipInner({ lang, t }: Props) {
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

    // Поддерживает украинские, русские,
    // эстонские, финские и другие буквы.
    const nameRegex = /^[\p{L}\s'-]+$/u;

    if (!formData.firstName.trim()) {
      newErrors.firstName =
        t.validation.firstNameRequired;
    } else if (
      formData.firstName.trim().length < 2
    ) {
      newErrors.firstName =
        t.validation.firstNameMin;
    } else if (
      !nameRegex.test(formData.firstName.trim())
    ) {
      newErrors.firstName =
        t.validation.lettersOnly;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName =
        t.validation.lastNameRequired;
    } else if (
      formData.lastName.trim().length < 2
    ) {
      newErrors.lastName =
        t.validation.lastNameMin;
    } else if (
      !nameRegex.test(formData.lastName.trim())
    ) {
      newErrors.lastName =
        t.validation.lettersOnly;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email =
        t.validation.emailRequired;
    } else if (
      !emailRegex.test(formData.email.trim())
    ) {
      newErrors.email =
        t.validation.emailInvalid;
    } else {
      const domain = formData.email
        .trim()
        .split("@")[1]
        ?.toLowerCase();

      if (
        domain &&
        DISPOSABLE_EMAILS.includes(domain)
      ) {
        newErrors.email =
          t.validation.emailDisposable;
      }
    }

    if (!formData.message.trim()) {
      newErrors.message =
        t.validation.messageRequired;
    } else if (
      formData.message.trim().length < 10
    ) {
      newErrors.message =
        t.validation.messageMin;
    } else if (formData.message.length > 500) {
      newErrors.message =
        t.validation.messageMax;
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s+()-]+$/;

      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone =
          t.validation.phoneInvalid;
      } else {
        const digitsOnly =
          formData.phone.replace(/\D/g, "");

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
    >
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
    event: FormEvent<HTMLFormElement>
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
          source: "partnership",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send message: ${response.status}`
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
          : String(error)
      );

      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = (
    hasError: boolean
  ) =>
    [
      "w-full border-b bg-transparent pb-1",
      "text-white outline-none",
      "transition-colors",
      hasError
        ? "border-red-500"
        : "border-gray-400/50 focus:border-yellow-400",
    ].join(" ");

  return (
    <div className="relative mx-auto mb-24 mt-2 max-w-7xl overflow-hidden">
      <div className="lg:absolute lg:inset-0 lg:left-1/2 lg:pl-4">
        <Image
          width={640}
          height={850}
          alt={t.imageAlt ?? t.title}
          src="/category/fresh-light-beer-mug.jpg"
          className="h-64 w-full bg-gray-800 object-cover sm:h-80 lg:absolute lg:h-full"
        />
      </div>

      <div className="pt-12 sm:pt-24 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-2">
        <div className="px-6">
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
            <h1 className="text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t.title}
            </h1>

            <p className="mt-4 text-base/8 text-gray-400">
              {t.subtitle}
            </p>

            {sent ? (
              <div
                className="mt-8 rounded-md border border-green-500/50 bg-green-500/10 p-4"
                role="status"
              >
                <p className="text-sm text-green-400">
                  {t.form.success}
                </p>
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="mt-16"
              noValidate
            >
              <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-base tracking-wide text-gray-400"
                  >
                    {t.form.firstname}
                  </label>

                  <div className="mt-2.5">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleChange}
                      aria-invalid={
                        Boolean(errors.firstName)
                      }
                      aria-describedby={
                        errors.firstName
                          ? "firstName-error"
                          : undefined
                      }
                      className={inputClassName(
                        Boolean(errors.firstName)
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
                    className="text-base tracking-wide text-gray-400"
                  >
                    {t.form.lastname}
                  </label>

                  <div className="mt-2.5">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleChange}
                      aria-invalid={
                        Boolean(errors.lastName)
                      }
                      aria-describedby={
                        errors.lastName
                          ? "lastName-error"
                          : undefined
                      }
                      className={inputClassName(
                        Boolean(errors.lastName)
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
                    className="text-base tracking-wide text-gray-400"
                  >
                    {t.form.emailLabel}
                  </label>

                  <div className="mt-2.5">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={
                        Boolean(errors.email)
                      }
                      aria-describedby={
                        errors.email
                          ? "email-error"
                          : undefined
                      }
                      className={inputClassName(
                        Boolean(errors.email)
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
                    className="text-base tracking-wide text-gray-400"
                  >
                    {t.form.company}
                  </label>

                  <div className="mt-2.5">
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
                  <div className="flex justify-between gap-4 text-sm/6">
                    <label
                      htmlFor="phone"
                      className="text-base tracking-wide text-gray-400"
                    >
                      {t.form.phone}
                    </label>

                    <span
                      id="phone-description"
                      className="text-gray-500"
                    >
                      {t.form.optional}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      aria-invalid={
                        Boolean(errors.phone)
                      }
                      aria-describedby={
                        errors.phone
                          ? "phone-description phone-error"
                          : "phone-description"
                      }
                      className={inputClassName(
                        Boolean(errors.phone)
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
                  <div className="flex justify-between gap-4 text-sm/6">
                    <label
                      htmlFor="message"
                      className="text-base tracking-wide text-gray-400"
                    >
                      {t.form.message}
                    </label>

                    <span
                      id="message-description"
                      className="text-gray-500"
                    >
                      {t.form.messageLimit}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      maxLength={500}
                      value={formData.message}
                      onChange={handleChange}
                      aria-invalid={
                        Boolean(errors.message)
                      }
                      aria-describedby={
                        errors.message
                          ? "message-description message-error"
                          : "message-description"
                      }
                      className={[
                        "mt-2 w-full rounded-md border",
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

              <div className="mt-10 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-2 text-base font-semibold text-gray-900 transition-colors duration-300 hover:border-yellow-600 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:w-full"
                >
                  {isSubmitting
                    ? t.form.submitting
                    : t.form.submit}
                </button>
              </div>

              {submitStatus === "success" ? (
                <div
                  className="mt-8 rounded-md border border-green-500/50 bg-green-500/10 p-4"
                  role="status"
                >
                  <p className="text-sm text-green-400">
                    {t.form.success}
                  </p>
                </div>
              ) : null}

              {submitStatus === "error" ? (
                <div
                  className="mt-8 rounded-md border border-red-500/50 bg-red-500/10 p-4"
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
      </div>
    </div>
  );
}

export default function PartnershipClient(
  props: Props
) {
  return (
    <Suspense fallback={null}>
      <PartnershipInner {...props} />
    </Suspense>
  );
}