"use client";

import { useState } from "react";
import { useCart } from "@/app/context/CartContext";

type Props = {
  lineId: string;
  quantity: number;
};

export default function QuantityCounter({ lineId, quantity }: Props) {
  const { updateLineQuantity, removeLine } = useCart();
  const [busy, setBusy] = useState(false);

  async function inc() {
    try {
      setBusy(true);
      await updateLineQuantity(lineId, quantity + 1);
    } finally {
      setBusy(false);
    }
  }

  async function dec() {
    try {
      setBusy(true);
      const next = quantity - 1;
      if (next <= 0) {
        await removeLine(lineId);
      } else {
        await updateLineQuantity(lineId, next);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 inline-flex items-center gap-3 rounded-md border border-white/15 bg-white/5 px-3 py-2">
      <button
        onClick={dec}
        disabled={busy}
        className="h-10 w-10 rounded-md bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
      >
        –
      </button>

      <div className="min-w-10 text-center text-lg font-semibold text-white">
        {quantity}
      </div>

      <button
        onClick={inc}
        disabled={busy}
        className="h-10 w-10 rounded-md bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
