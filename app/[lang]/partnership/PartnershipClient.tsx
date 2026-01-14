// app/[lang]/partnership/PartnershipClient.tsx
"use client";

import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
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

function PartnershipInner({ lang, t }: Props) {
  const searchParams = useSearchParams();
  const sent = searchParams.get("sent") === "1";

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(formData.firstName)) {
      newErrors.firstName = "Only letters, spaces and hyphens allowed";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(formData.lastName)) {
      newErrors.lastName = "Only letters, spaces and hyphens allowed";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const disposableEmails = [
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "throwaway.email",
      "temp-mail.org",
    ];

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    } else {
      const domain = formData.email.split("@")[1]?.toLowerCase();
      if (domain && disposableEmails.includes(domain)) {
        newErrors.email = "Please use a valid email address";
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.length > 500) {
      newErrors.message = "Message must be 500 characters or less";
    }

    if (formData.phone) {
      if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        newErrors.phone =
          "Invalid phone format (only digits, spaces, +, -, () allowed)";
      } else {
        const digitsOnly = formData.phone.replace(/\D/g, "");
        if (digitsOnly.length < 7) {
          newErrors.phone = "Phone must be at least 7 digits";
        } else if (digitsOnly.length > 15) {
          newErrors.phone = "Phone must be no more than 15 digits";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // ⚠️ если нужен другой endpoint для партнёрства — замени здесь
      const response = await fetch(`/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await response.text().catch(() => "");

      if (!response.ok) throw new Error("Failed to send message");

      setSubmitStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden max-w-7xl mx-auto mt-2 mb-24">
      <div className="lg:absolute lg:inset-0 lg:left-1/2 lg:pl-4">
        <Image
          width="640"
          height="850"
          alt={t.imageAlt ?? ""}
          src="/category/fresh-light-beer-mug.jpg"
          className="h-64 w-full bg-gray-800 object-cover sm:h-80 lg:absolute lg:h-full"
        />
      </div>

      <div className="pt-12 sm:pt-24 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-2">
        <div className="px-6">
          <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
            <h2 className="text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t.title}
            </h2>
            <p className="mt-4 text-base/8 text-gray-400">{t.subtitle}</p>

            {/* если пришли с /partnership?sent=1 — показываем success как у Contact */}
            {sent ? (
              <div className="mt-8 rounded-md bg-green-500/10 border border-green-500/50 p-4">
                <p className="text-sm text-green-400">{t.form.success}</p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-16">
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
                      className={`w-full border-b ${
                        errors.firstName ? "border-red-500" : "border-gray-400/50"
                      } bg-transparent pb-1 outline-none text-white`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.firstName}
                      </p>
                    )}
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
                      className={`w-full border-b ${
                        errors.lastName ? "border-red-500" : "border-gray-400/50"
                      } bg-transparent pb-1 outline-none text-white`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.lastName}
                      </p>
                    )}
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
                      className={`w-full border-b ${
                        errors.email ? "border-red-500" : "border-gray-400/50"
                      } bg-transparent pb-1 outline-none text-white`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                    )}
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
                      className="w-full border-b border-gray-400/50 bg-transparent pb-1 outline-none text-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between text-sm/6">
                    <label
                      htmlFor="phone"
                      className="text-base tracking-wide text-gray-400"
                    >
                      {t.form.phone}
                    </label>
                    <p id="phone-description" className="text-gray-500">
                      {t.form.optional}
                    </p>
                  </div>
                  <div className="mt-2.5">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      aria-describedby="phone-description"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full border-b ${
                        errors.phone ? "border-red-500" : "border-gray-400/50"
                      } bg-transparent pb-1 outline-none text-white`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between text-sm/6">
                    <label
                      htmlFor="message"
                      className="text-base tracking-wide text-gray-400"
                    >
                      {t.form.message}
                    </label>
                    <p id="message-description" className="text-gray-500">
                      {t.form.messageLimit}
                    </p>
                  </div>
                  <div className="mt-2.5">
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      aria-describedby="message-description"
                      value={formData.message}
                      onChange={handleChange}
                      className={`mt-2 w-full rounded-md border ${
                        errors.message ? "border-red-500" : "border-gray-400/40"
                      } bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center     rounded-md border border-gray-300 bg-white px-8 py-2 text-base font-semibold text-gray-900 duration-300 hover:border-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto lg:w-full"
                >

                  {isSubmitting ? t.form.submitting : t.form.submit}
                </button>
              </div>

              {submitStatus === "success" && (
                <div className="mt-8 rounded-md bg-green-500/10 border border-green-500/50 p-4">
                  <p className="text-sm text-green-400">{t.form.success}</p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mt-8 rounded-md bg-red-500/10 border border-red-500/50 p-4">
                  <p className="text-sm text-red-400">{t.form.error}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnershipClient(props: Props) {
  // чтобы не ловить missing-suspense-with-csr-bailout из-за useSearchParams
  return (
    <Suspense fallback={null}>
      <PartnershipInner {...props} />
    </Suspense>
  );
}
