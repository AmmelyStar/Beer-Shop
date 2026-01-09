"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TabsProps<T extends string> = {
  paramKey?: string;
  labels: Record<T, string>;
  keys: readonly  T[];
};

export default function Tabs<T extends string>({
  paramKey = "category",
  labels,
  keys,
}: TabsProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const active = (sp.get(paramKey) as T | null) ?? (keys[0] as T);

  const handleChange = (nextTab: T) => {
    const next = new URLSearchParams(sp.toString());
    next.set(paramKey, nextTab);

    if (nextTab === ("all" as T)) next.delete(paramKey);

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handleChange(key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            key === active
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}
