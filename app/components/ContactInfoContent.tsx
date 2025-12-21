"use client";

import type { Locale } from "@/app/lib/locale";

type ContactInfoMessages = {
  Contact: {
    title?: string;
    address?: string;
    phone?: string;
    email?: string;
    hours?: string;
    partnershipCta?: string;
  };
};

export default function ContactInfoContent({
  lang,
  messages,
}: {
  lang: Locale;
  messages: ContactInfoMessages;
}) {
  const m = messages.Contact;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-3xl border p-6 sm:p-10">
        {m.title ? <h2 className="text-2xl font-semibold">{m.title}</h2> : null}

        <div className="mt-6 space-y-4">
          {m.address ? <p className="whitespace-pre-line">{m.address}</p> : null}
          {m.phone ? <p className="whitespace-pre-line">{m.phone}</p> : null}
          {m.email ? <p className="whitespace-pre-line">{m.email}</p> : null}
          {m.hours ? <p className="whitespace-pre-line">{m.hours}</p> : null}
        </div>

        
      </div>
    </section>
  );
}
