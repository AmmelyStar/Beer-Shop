// app/components/ui/AddToCartButton.tsx
"use client";

import { useCart } from "@/app/context/CartContext";
import { FlattenedProduct } from "@/app/data/mappers";
import QuantityCounter from "./QuantityCounter";

type AddToCartButtonProps = {
  product: FlattenedProduct & {
    // сюда приходит ID варианта Shopify (gid://shopify/ProductVariant/...)
    variantId: string;
  };
  // делаем необязательным и даём дефолтный текст
  label?: string;
};

export default function AddToCartButton({
  product,
  label,
}: AddToCartButtonProps) {
  const { items, addToCart } = useCart();

  const variantId = product.variantId;
  const buttonLabel = label ?? "In den Warenkorb"; // <- текст на кнопке

  // ищем позицию в корзине с этим variantId
  const cartItem = items.find((item) => item.merchandiseId === variantId);

  const handleAddToCart = async () => {
    if (!variantId) {
      console.error("Missing variantId for product", product);
      return;
    }
    await addToCart(variantId, 1);
  };

  // если уже в корзине — показываем счётчик количества
  if (cartItem) {
    return (
      <QuantityCounter
        lineId={cartItem.id}         // id строки корзины
        quantity={cartItem.quantity} // текущее количество
      />
    );
  }

  // если ещё нет в корзине — обычная кнопка
  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-500 hover:border-yellow-600 sm:w-auto lg:w-full duration-300"
    >
      {buttonLabel}
    </button>
  );
}
