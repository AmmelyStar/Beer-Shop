// app/components/ui/Tabs.tsx
"use client";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  labels?: {
    all: string;
    beer: string;
    cider: string;
    snacks: string;
  };
}

export default function Tabs({
  activeTab,
  onTabChange,
  labels = {
    all: "All Products",
    beer: "Beer",
    cider: "Cider",
    snacks: "Snacks",
  },
}: TabsProps) {
  const tabs = [
    { id: "all", label: labels.all },
    { id: "beer", label: labels.beer },
    { id: "cider", label: labels.cider },
    { id: "snacks", label: labels.snacks },
  ];

  return (
    <div className="mb-8">
      {/* <h1 className="text-3xl font-bold mb-6">Shop</h1> */}
      <div className="flex gap-4 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 px-1 transition-colors ${
              activeTab === tab.id
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
