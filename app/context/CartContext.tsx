"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type CartLine = {
  id: string;
  merchandiseId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  imageAlt: string;
};

type CartState = {
  cartId: string;
  checkoutUrl: string | null;
  lines: CartLine[];
};

type CartContextType = {
  // Новый интерфейс
  cart: CartState;
  isLoading: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  updateLineQuantity: (lineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Старый интерфейс (для совместимости)
  items: CartLine[];
  totalPrice: number;
  removeFromCart: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const EMPTY_CART: CartState = {
  cartId: "",
  checkoutUrl: null,
  lines: [],
};

const STORAGE_KEY = "shopify_cart_id";

type CartApiResponse = CartState;

// Вспомогательный вызов API
async function callApi(body: unknown): Promise<CartApiResponse> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await res.json();
    } catch {
      // ignore
    }
    console.error("Cart API error", res.status, errorBody);
    throw new Error("Cart API error");
  }

  const json = (await res.json()) as CartApiResponse;
  return json;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  function syncCart(next: CartState) {
    setCart(next);

    if (typeof window === "undefined") return;

    if (next.cartId) {
      window.localStorage.setItem(STORAGE_KEY, next.cartId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const fetchCart = async () => {
    if (typeof window === "undefined") return;

    try {
      setIsLoading(true);
      const storedId = window.localStorage.getItem(STORAGE_KEY);

      if (!storedId || storedId === "undefined" || storedId === "null") {
        syncCart(EMPTY_CART);
        return;
      }

      const data = await callApi({
        action: "get",
        cartId: storedId,
      });

      syncCart(data);
    } catch (e) {
      console.error("fetchCart error:", e);
      syncCart(EMPTY_CART);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (variantId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);

      const data = await callApi({
        action: "add",
        cartId: cart.cartId || undefined,
        variantId,
        quantity,
      });

      syncCart(data);
    } catch (e) {
      console.error("addToCart error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const removeLine = async (lineId: string) => {
    if (!cart.cartId) return;

    try {
      setIsLoading(true);

      const data = await callApi({
        action: "remove",
        cartId: cart.cartId,
        lineId,
      });

      syncCart(data);
    } catch (e) {
      console.error("removeLine error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLineQuantity = async (lineId: string, quantity: number) => {
    if (!cart.cartId) return;

    try {
      setIsLoading(true);

      const data = await callApi({
        action: "update",
        cartId: cart.cartId,
        lineId,
        quantity,
      });

      syncCart(data);
    } catch (e) {
      console.error("updateLineQuantity error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!cart.cartId) {
      syncCart(EMPTY_CART);
      return;
    }

    try {
      setIsLoading(true);

      const data = await callApi({
        action: "clear",
        cartId: cart.cartId,
      });

      syncCart(data);
    } catch (e) {
      console.error("clearCart error:", e);
      // если что-то пошло не так — всё равно сбрасываем локально
      syncCart(EMPTY_CART);
    } finally {
      setIsLoading(false);
    }
  };

  // Авто-фетч при монтировании
  useEffect(() => {
    void fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Удобные поля для старых компонентов
  const items = cart.lines;
  const totalPrice = items.reduce(
    (sum: number, line: CartLine) => sum + line.unitPrice * line.quantity,
    0
  );

  const removeFromCart = (lineId: string) => removeLine(lineId);
  const updateQuantity = (lineId: string, quantity: number) =>
    updateLineQuantity(lineId, quantity);

  const value: CartContextType = {
    cart,
    isLoading,
    addToCart,
    fetchCart,
    removeLine,
    updateLineQuantity,
    clearCart,
    items,
    totalPrice,
    removeFromCart,
    updateQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
