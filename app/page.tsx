'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const locales = ['en', 'et', 'ru', 'fi'] as const;
type Locale = (typeof locales)[number];

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase() as Locale;

    // Проверяем, поддерживается ли язык
    const targetLocale: Locale = locales.includes(browserLang) ? browserLang : 'en';

    router.replace(`/${targetLocale}`);
  }, [router]);

  return null;
}
