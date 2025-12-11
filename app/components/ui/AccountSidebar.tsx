"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/app/lib/locale";

const classNames = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type NavItem = { href: string; label: string };

type SidebarUser = {
  firstName: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
};

type AccountSidebarProps = {
  user: SidebarUser;
  navItems: NavItem[];
  baseAccountPath: string;
  effectiveLang: Locale;
  onSignOut: () => void | Promise<void>;
  signingOutLabel: string;
  signOutLabel: string;
  greetingLabel: string; // messages.AccountPage.sidebarGreeting
  loading: boolean;
};

export function AccountSidebar({
  user,
  navItems,
  baseAccountPath,

  onSignOut,
  signingOutLabel,
  signOutLabel,
  greetingLabel,
  loading,
}: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="lg:col-span-4 space-y-6">
      {/* Мини-профиль */}
      <div className="p-6">
        <p className="pb-6 text-base text-gray-400">
          {greetingLabel}
          {user.firstName ? "," : ""}
        </p>
        <p className="pb-6 truncate text-2xl font-semibold text-white">
          {user.firstName || user.primaryEmailAddress?.emailAddress}
        </p>
        <p className="mt-1 truncate text-sm text-gray-500">
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>

      {/* Навигация */}
      <nav className="rounded-xl border border-white/10 bg-white/5 px-3 pt-2 pb-0 text-sm text-gray-200">
        <div className="flex w-full flex-col gap-6 border-b border-white/10 py-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== baseAccountPath &&
                pathname?.startsWith(item.href));
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={classNames(
                  "w-full flex-1 border-b-2 pb-3 px-1 text-left text-base transition-colors",
                  isActive
                    ? "border-yellow-400 font-semibold text-yellow-400"
                    : "border-transparent text-gray-400 hover:text-white"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Выход */}
      <button
        onClick={onSignOut}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-2 text-base font-semibold text-gray-900 duration-300 hover:border-yellow-600 hover:bg-yellow-500 sm:w-auto lg:w-full"
      >
        {loading ? signingOutLabel : signOutLabel}
      </button>
    </aside>
  );
}
