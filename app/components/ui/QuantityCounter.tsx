// app/components/ui/QuantityCounter.tsx
"use client";
import { useCart } from "@/app/context/CartContext";

type QuantityCounterProps = {
  productId: string;
  quantity: number;
};

export default function QuantityCounter({
  productId,
  quantity,
}: QuantityCounterProps) {
  const { updateQuantity } = useCart();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => updateQuantity(productId, quantity - 1)}
        className="flex size-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <span className="sr-only">Decrease quantity</span>
        <span className="text-lg font-medium">−</span>
      </button>
      <span className="w-10 text-center text-base font-medium text-white">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => updateQuantity(productId, quantity + 1)}
        className="flex size-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <span className="sr-only">Increase quantity</span>
        <span className="text-lg font-medium">+</span>
      </button>
    </div>
  );
}
