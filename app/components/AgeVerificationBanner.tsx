"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";

type SupportedLocale = "en" | "ru" | "uk" | "et" | "fi";

const STORAGE_KEY = "beer-shop-age-confirmed";
const STORAGE_CHANGE_EVENT = "beer-shop-age-confirmed-change";

const translations: Record<
  SupportedLocale,
  {
    eyebrow: string;
    title: string;
    description: string;
    confirm: string;
    decline: string;
    denied: string;
  }
> = {
  en: {
    eyebrow: "Age verification",
    title: "Are you 18 or older?",
    description:
      "This website sells alcoholic beverages. Please confirm that you are of legal drinking age.",
    confirm: "Yes, I am 18+",
    decline: "No, leave the website",
    denied: "You must be 18 or older to visit this website.",
  },
  ru: {
    eyebrow: "Проверка возраста",
    title: "Вам уже исполнилось 18 лет?",
    description:
      "На этом сайте продаются алкогольные напитки. Подтвердите, что вы достигли совершеннолетия.",
    confirm: "Да, мне есть 18 лет",
    decline: "Нет, покинуть сайт",
    denied: "Для посещения этого сайта вам должно быть не менее 18 лет.",
  },
  uk: {
    eyebrow: "Перевірка віку",
    title: "Вам уже виповнилося 18 років?",
    description:
      "На цьому сайті продаються алкогольні напої. Підтвердьте, що ви досягли повноліття.",
    confirm: "Так, мені є 18 років",
    decline: "Ні, залишити сайт",
    denied: "Для відвідування цього сайту вам має бути щонайменше 18 років.",
  },
  et: {
    eyebrow: "Vanuse kontroll",
    title: "Kas olete vähemalt 18-aastane?",
    description:
      "Sellel veebisaidil müüakse alkohoolseid jooke. Palun kinnitage, et olete täisealine.",
    confirm: "Jah, olen vähemalt 18",
    decline: "Ei, lahkun veebisaidilt",
    denied: "Selle veebisaidi külastamiseks peate olema vähemalt 18-aastane.",
  },
  fi: {
    eyebrow: "Iän vahvistaminen",
    title: "Oletko vähintään 18-vuotias?",
    description:
      "Tällä verkkosivustolla myydään alkoholijuomia. Vahvista, että olet täysi-ikäinen.",
    confirm: "Kyllä, olen vähintään 18",
    decline: "En, poistu sivustolta",
    denied: "Sinun on oltava vähintään 18-vuotias käyttääksesi tätä verkkosivustoa.",
  },
};

function getLocale(value: string | string[] | undefined): SupportedLocale {
  const locale = Array.isArray(value) ? value[0] : value;
  return locale && locale in translations
    ? (locale as SupportedLocale)
    : "en";
}

function subscribeToAgeConfirmation(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_CHANGE_EVENT, callback);
  };
}

function getAgeConfirmationSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getAgeConfirmationServerSnapshot() {
  // During SSR and the first hydration render the banner stays hidden.
  // React then reads localStorage through getAgeConfirmationSnapshot.
  return true;
}

export default function AgeVerificationBanner() {
  const params = useParams<{ lang?: string | string[] }>();
  const locale = getLocale(params?.lang);
  const text = useMemo(() => translations[locale], [locale]);

  const [denied, setDenied] = useState(false);
  const ageConfirmed = useSyncExternalStore(
    subscribeToAgeConfirmation,
    getAgeConfirmationSnapshot,
    getAgeConfirmationServerSnapshot
  );
  const visible = !ageConfirmed;

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const confirmAge = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  };

  const leaveWebsite = () => {
    setDenied(true);
    window.location.replace("https://www.google.com");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verification-title"
      aria-describedby="age-verification-description"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 shadow-2xl">
        <div className="h-1.5 bg-yellow-400" />

        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-400 text-3xl font-black text-yellow-400">
            18+
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
            {text.eyebrow}
          </p>

          <h2
            id="age-verification-title"
            className="mt-3 text-3xl font-extrabold uppercase leading-tight text-white sm:text-4xl"
          >
            {text.title}
          </h2>

          <p
            id="age-verification-description"
            className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-300 sm:text-base"
          >
            {denied ? text.denied : text.description}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={confirmAge}
              autoFocus
              className="inline-flex items-center justify-center rounded-md bg-yellow-400 px-6 py-3 text-sm font-bold uppercase text-neutral-950 transition-colors hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {text.confirm}
            </button>

            <button
              type="button"
              onClick={leaveWebsite}
              className="inline-flex items-center justify-center rounded-md border-2 border-white px-6 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              {text.decline}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
