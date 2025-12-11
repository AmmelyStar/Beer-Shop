// app/components/AccountAddressesContent.tsx
"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/app/lib/locale";
import { validatePhone } from "@/app/lib/utils/validatePhone";
import { AccountSidebar } from "../components/ui/AccountSidebar";

type ShippingAddressMetadata = {
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  comment?: string;
  updatedAt?: string;
};

type ProfileMetadata = {
  phone?: string;
  shippingAddress?: ShippingAddressMetadata;
};

type AddressFormState = {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string;
  comment: string;
  isDefault: boolean;
};

// мини-типы под наши JSON-секции
type AccountPageMessages = {
  signingOut: string;
  signOut: string;
  sidebarGreeting: string;
  tabProfile: string;
  tabOrders: string;
  tabReviews: string;
  tabAddresses: string;
  phoneErrorInvalid: string;
  phoneErrorTooShort: string;
  phoneErrorTooLong: string;
};

type AccountAddressesPageMessages = {
  title: string;
  intro: string;
  fullName: string;
  fullNamePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  country: string;
  countryEE: string;
  countryFI: string;
  countryLV: string;
  countryLT: string;
  city: string;
  cityPlaceholder: string;
  street: string;
  streetPlaceholder: string;
  postalCode: string;
  postalCodePlaceholder: string;
  comment: string;
  commentPlaceholder: string;
  saveButton: string;
  saving: string;
  saveUnknownError: string;
};

type AccountAddressesContentProps = {
  accountMessages: AccountPageMessages; // "AccountPage"
  addressMessages: AccountAddressesPageMessages; // "AccountAddressesPage"
};

export default function AccountAddressesContent({
  accountMessages,
  addressMessages,
}: AccountAddressesContentProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const params = useParams();

  const [loadingLogout, setLoadingLogout] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const langFromParams = params?.lang;
  const lang = (
    Array.isArray(langFromParams) ? langFromParams[0] : langFromParams
  ) as Locale | undefined;
  const effectiveLang = (lang || "en") as Locale;

  const baseAccountPath = `/${effectiveLang}/account`;

  const navItems = [
    { href: baseAccountPath, label: accountMessages.tabProfile },
    { href: `${baseAccountPath}/orders`, label: accountMessages.tabOrders },
    { href: `${baseAccountPath}/reviews`, label: accountMessages.tabReviews },
    {
      href: `${baseAccountPath}/addresses`,
      label: accountMessages.tabAddresses,
    },
  ];

  const rawMetadata = (user?.publicMetadata ?? {}) as ProfileMetadata;
  const initialShipping = rawMetadata.shippingAddress ?? {};

  const [addressForm, setAddressForm] = useState<AddressFormState>(() => ({
    fullName:
      initialShipping.fullName ||
      (user?.firstName || user?.lastName
        ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
        : "") ||
      "",
    phone: initialShipping.phone || rawMetadata.phone || "",
    country: initialShipping.country || "EE",
    city: initialShipping.city || "",
    street: initialShipping.street || "",
    postalCode: initialShipping.postalCode || "",
    comment: initialShipping.comment || "",
    isDefault: true,
  }));

  // когда user / metadata обновились — подтягиваем shippingAddress
  useEffect(() => {
    if (!user) return;

    const m = (user.publicMetadata ?? {}) as ProfileMetadata;
    const shipping = m.shippingAddress ?? {};

    setAddressForm((prev) => ({
      ...prev,
      fullName:
        shipping.fullName ||
        (user.firstName || user.lastName
          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
          : prev.fullName) ||
        "",
      phone: shipping.phone || m.phone || prev.phone,
      country: shipping.country || prev.country,
      city: shipping.city ?? prev.city,
      street: shipping.street ?? prev.street,
      postalCode: shipping.postalCode ?? prev.postalCode,
      comment: shipping.comment ?? prev.comment,
    }));
  }, [user]);

  const handleChange = <K extends keyof AddressFormState>(
    field: K,
    value: AddressFormState[K]
  ) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setPhoneError(null);

    const phoneCheck = validatePhone(addressForm.phone);
    if (phoneCheck.error) {
      const msg =
        phoneCheck.error === "invalid"
          ? accountMessages.phoneErrorInvalid
          : phoneCheck.error === "tooShort"
          ? accountMessages.phoneErrorTooShort
          : accountMessages.phoneErrorTooLong;

      setPhoneError(msg);
      return;
    }

    setSavingAddress(true);

    try {
      const payload = {
        ...addressForm,
        phone: phoneCheck.normalized,
      };

      const res = await fetch("/api/account/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = addressMessages.saveUnknownError;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      // подтянуть свежие данные из Clerk (чтобы metadata в user обновились)
      await user?.reload();
    } catch (err) {
      console.error(err);
      setFormError(addressMessages.saveUnknownError);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSignOut = async () => {
    setLoadingLogout(true);
    try {
      await signOut({ redirectUrl: `/${effectiveLang}/account` });
    } catch (error) {
      console.error("Sign out error:", error);
      setLoadingLogout(false);
    }
  };

  if (!isLoaded) {
    return (
      <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-yellow-400" />
        </div>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section className="relative mx-auto my-10 max-w-7xl rounded-b-3xl">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        <AccountSidebar
          user={user}
          navItems={navItems}
          baseAccountPath={baseAccountPath}
          effectiveLang={effectiveLang}
          onSignOut={handleSignOut}
          signingOutLabel={accountMessages.signingOut}
          signOutLabel={accountMessages.signOut}
          greetingLabel={accountMessages.sidebarGreeting}
          loading={loadingLogout}
        />

        <main className="mt-10 space-y-6 lg:col-span-8 lg:mt-0">
          <section className="p-6">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {addressMessages.title}
                </h1>
                <p className="mt-4 text-base text-gray-400">
                  {addressMessages.intro}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-8 pt-4 sm:grid-cols-2"
            >
              <div>
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.fullName}
                </label>
                <input
                  type="text"
                  value={addressForm.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white outline-none"
                  placeholder={addressMessages.fullNamePlaceholder}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.phone}
                </label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => {
                    handleChange("phone", e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white outline-none"
                  placeholder={addressMessages.phonePlaceholder}
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-400">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.country}
                </label>
                <select
                  value={addressForm.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white outline-none"
                >
                  <option value="EE" className="bg-black text-white">
                    {addressMessages.countryEE}
                  </option>
                  <option value="FI" className="bg-black text-white">
                    {addressMessages.countryFI}
                  </option>
                  <option value="LV" className="bg-black text-white">
                    {addressMessages.countryLV}
                  </option>
                  <option value="LT" className="bg-black text-white">
                    {addressMessages.countryLT}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.city}
                </label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white outline-none"
                  placeholder={addressMessages.cityPlaceholder}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.street}
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white outline-none"
                  placeholder={addressMessages.streetPlaceholder}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.postalCode}
                </label>
                <input
                  type="text"
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    handleChange("postalCode", e.target.value.trim())
                  }
                  className="mt-2 w-full border-b border-gray-400/50 bg-transparent pb-1 text-base text-white outline-none"
                  placeholder={addressMessages.postalCodePlaceholder}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-400">
                  {addressMessages.comment}
                </label>
                <textarea
                  value={addressForm.comment}
                  onChange={(e) => handleChange("comment", e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-gray-400/40 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500"
                  placeholder={addressMessages.commentPlaceholder}
                />
              </div>

              <button
                type="submit"
                disabled={savingAddress}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-white/25 px-8 py-2 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60"
              >
                {savingAddress
                  ? addressMessages.saving
                  : addressMessages.saveButton}
              </button>
            </form>

            {formError && (
              <p className="mt-4 text-sm text-red-400">{formError}</p>
            )}
          </section>
        </main>
      </div>
    </section>
  );
}
