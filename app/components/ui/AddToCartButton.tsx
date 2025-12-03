// app/components/ui/AddToCartButton.tsx
"use client";
import { useCart } from "@/app/context/CartContext";
import { FlattenedProduct } from "@/app/data/mappers";
import QuantityCounter from "./QuantityCounter";

type AddToCartButtonProps = {
  product: FlattenedProduct;
  addToCart: string; // ← название как раньше
};

export default function AddToCartButton({
  product,
  addToCart, // ← название как раньше
}: AddToCartButtonProps) {
  const { items, addToCart: addItemToCart } = useCart(); // ← переименовали функцию

  const cartItem = items.find((item) => item.id === product.id);

  const handleAddToCart = () => {
    addItemToCart({
      // ← используем переименованную функцию
      id: product.id,
      name: product.title,
      price: parseFloat(product.priceRange.minVariantPrice.amount),
      imageSrc: product.images?.edges[0]?.node.url || "",
      imageAlt: product.title,
      country: product.specs?.country,
      size: product.specs?.pack_size_l
        ? `${product.specs.pack_size_l} L`
        : undefined,
      abv: product.specs?.abv,
    });
  };

  if (cartItem) {
    return (
      <QuantityCounter productId={product.id} quantity={cartItem.quantity} />
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-500 hover:border-yellow-600 sm:w-auto lg:w-full duration-300"
    >
      {addToCart} {/* ← текст кнопки */}
    </button>
  );
}
