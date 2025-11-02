// app/components/Header.tsx
import type { Locale } from "@/app/lib/locale";
import LanguageSwitcher from "./ui/LanguageSwitcher";
import ProfileButton from "./ui/ProfileButton";

export default function Header({ lang }: { lang: Locale }) {
  return (
    <header className="relative z-10 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-end px-6 py-3 gap-8">
        <LanguageSwitcher current={lang} />
        <ProfileButton lang={lang} />
      </div>
    </header>
  );
}
