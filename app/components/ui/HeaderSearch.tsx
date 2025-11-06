"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type HeaderSearchMessages = {
  HeaderSearch?: { label?: string; placeholder?: string };
};

export default function HeaderSearch({
  lang,
  messages,
  label,
}: {
  lang: string;
  messages?: HeaderSearchMessages;
  /** кастомная подпись (перебьёт messages) */
  label?: string;
}) {
  const Label = messages?.HeaderSearch?.label ?? label ?? "Search products"; // дефолт на случай отсутствия messages

  return (
    <button
      type="button"
      aria-label={Label}
      className=" p-2 text-gray-400  hover:text-yellow-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-md"
    >
      <span className="sr-only">{Label}</span>
      <MagnifyingGlassIcon aria-hidden="true" className="h-6 w-6" />
    </button>
  );
}
