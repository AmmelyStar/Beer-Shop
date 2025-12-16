"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { FlattenedProduct } from "@/app/data/mappers";

type AddToCartButtonProps = {
  product: FlattenedProduct & { variantId: string };
  label?: string;
};

export default function AddToCartButton({ product, label }: AddToCartButtonProps) {
  const { items, addToCart } = useCart();

  const variantId = product.variantId;
  const buttonLabel = label ?? "Add to cart";

  const cartItem = items.find((item) => item.merchandiseId === variantId);
  const inCartQty = cartItem?.quantity ?? 0;

  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [busy, setBusy] = useState(false);

  const dec = () => setQtyToAdd((q) => Math.max(1, q - 1));
  const inc = () => setQtyToAdd((q) => Math.min(99, q + 1));

  const handleAdd = async () => {
    if (!variantId) {
      console.error("Missing variantId for product", product);
      return;
    }
    try {
      setBusy(true);
      await addToCart(variantId, qtyToAdd);
      setQtyToAdd(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {/* компактный счетчик сверху */}
      <div className="inline-flex w-full items-center justify-between rounded-md border border-white/15 bg-white/5 px-2 py-1">
        <button
          type="button"
          onClick={dec}
          disabled={busy}
          className="h-8 w-8 rounded-md bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
          aria-label="Decrease"
        >
          –
        </button>

        <div className="min-w-10 text-center text-sm font-semibold text-white">
          {qtyToAdd}
          {inCartQty > 0 && (
            <span className="ml-2 text-xs font-medium text-gray-300">
              (in cart: {inCartQty})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={inc}
          disabled={busy}
          className="h-8 w-8 rounded-md bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
          aria-label="Increase"
        >
          +
        </button>
      </div>

      {/* кнопка снизу — тонкая, на всю ширину */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent px-6 py-2 text-sm font-semibold text-gray-200 hover:bg-white/5 hover:border-white/30 duration-300 disabled:opacity-60"
      >
        {busy ? "Adding…" : buttonLabel}
      </button>
    </div>
  );
}
