// app/components/ui/QuantityCounter.tsx
"use client";

import { useCart } from "@/app/context/CartContext";

export type QuantityCounterProps = {
  lineId: string;   // id строки корзины (CartLine.id)
  quantity: number; // текущее количество
};

export default function QuantityCounter({ lineId, quantity }: QuantityCounterProps) {
  const { updateQuantity, loading } = useCart();

  const handleDecrement = async () => {
    if (loading) return;
    const next = quantity - 1;
    await updateQuantity(lineId, next);
  };

  const handleIncrement = async () => {
    if (loading) return;
    const next = quantity + 1;
    await updateQuantity(lineId, next);
  };

  return (
    <div className="inline-flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm sm:w-auto lg:w-full">
      <button
        type="button"
        onClick={handleDecrement}
        className="px-2 text-lg leading-none"
        disabled={loading}
      >
        –
      </button>
      <span className="px-3 text-base font-medium">{quantity}</span>
      <button
        type="button"
        onClick={handleIncrement}
        className="px-2 text-lg leading-none"
        disabled={loading}
      >
        +
      </button>
    </div>
  );
}
