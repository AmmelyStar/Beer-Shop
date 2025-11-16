"use client";

type TabsProps<T extends string> = {
  activeTab: T;
  onTabChange: (tab: T) => void;
  labels: Record<T, string>;
  keys: T[]; // список категорий передаём извне!
};

export default function Tabs<T extends string>({
  activeTab,
  onTabChange,
  labels,
  keys,
}: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            key === activeTab
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-300"
          }`}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}
