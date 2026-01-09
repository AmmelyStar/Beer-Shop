"use client";

type TabsProps<T extends string> = {
  labels: Record<T, string>;
  keys: readonly T[];
  active: T;
  onChange: (next: T) => void;
};

export default function Tabs<T extends string>({ labels, keys, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
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
