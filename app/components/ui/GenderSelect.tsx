// app/components/ui/GenderSelect.tsx
"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export type GenderCode = "" | "female" | "male" | "other";

const DEFAULT_LABELS: Record<GenderCode, string> = {
  "": "Not specified",
  female: "female",
  male: "male",
  other: "other",
};

const GENDERS: GenderCode[] = ["", "female", "male", "other"];

type GenderSelectProps = {
  value: string;
  onChange: (value: GenderCode) => void;
  labels?: Partial<Record<GenderCode, string>>;
};

export function GenderSelect({ value, onChange, labels }: GenderSelectProps) {
  const active = (value as GenderCode) || "";
  const LABELS: Record<GenderCode, string> = {
    ...DEFAULT_LABELS,
    ...(labels || {}),
  };

  return (
    <Popover className="relative inline-block">
      <PopoverButton className="inline-flex items-center gap-x-1 text-base text-white hover:text-yellow-500">
        <span>{LABELS[active]}</span>
        <ChevronDownIcon aria-hidden="true" className="size-5" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute z-50 mt-2 w-48
        rounded-2xl shadow-lg shadow-black/50
        ring-1 ring-white/15
        bg-linear-to-b from-white/55 to-white/20
        dark:from-stone-950/75 dark:to-stone-950/80
        data-closed:translate-y-1 data-closed:opacity-0
        data-enter:duration-200 data-leave:duration-150 data-enter:ease-out data-leave:ease-in
      "
      >
        <div className="shrink rounded-xl p-2 text-base text-gray-200">
          {GENDERS.map((g) => {
            const isActive = g === active;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onChange(g)}
                className={`block w-full rounded-md p-2 text-left ${
                  isActive
                    ? "text-yellow-500 bg-linear-to-br from-stone-300/20 to-stone-900/50 "
                    : "hover:text-yellow-500"
                }`}
              >
                {LABELS[g]}
              </button>
            );
          })}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
