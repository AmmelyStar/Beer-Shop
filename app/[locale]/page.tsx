"use client";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations();

  return (
    <main style={{ padding: 24 }}>
      <h1>{t("home.title")}</h1>
      <p>{t("home.welcome")}</p>
      <button>{t("action.add")}</button>
    </main>
  );
}
