// app/context/CartContext.tsx

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
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
  cart: CartState;
  isLoading: boolean;

  addToCart: (
    variantId: string,
    quantity?: number
  ) => Promise<void>;

  fetchCart: () => Promise<void>;

  removeLine: (
    lineId: string
  ) => Promise<void>;

  updateLineQuantity: (
    lineId: string,
    quantity: number
  ) => Promise<void>;

  clearCart: () => Promise<void>;

  /**
   * Очищает только локальное состояние и localStorage.
   * Shopify-корзина при этом не изменяется.
   */
  resetLocalCart: () => void;

  totalQuantity: number;

  // Старый интерфейс для совместимости
  items: CartLine[];
  totalPrice: number;

  removeFromCart: (
    lineId: string
  ) => Promise<void>;

  updateQuantity: (
    lineId: string,
    quantity: number
  ) => Promise<void>;
};

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

const EMPTY_CART: CartState = {
  cartId: "",
  checkoutUrl: null,
  lines: [],
};

const STORAGE_KEY = "shopify_cart_id";

type CartApiResponse = CartState | null;

async function callApi(
  body: unknown
): Promise<CartApiResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      // Ответ может быть не JSON
    }

    console.error(
      "Cart API error:",
      response.status,
      errorBody
    );

    throw new Error(
      `Cart API error: ${response.status}`
    );
  }

  return (await response.json()) as CartApiResponse;
}

function isValidCartState(
  value: CartApiResponse
): value is CartState {
  return Boolean(
    value &&
      typeof value.cartId === "string" &&
      typeof value.checkoutUrl !== "undefined" &&
      Array.isArray(value.lines)
  );
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartState>(EMPTY_CART);

  const [isLoading, setIsLoading] =
    useState(false);

  const fetchInProgressRef = useRef(false);

  /**
   * Синхронизирует React-состояние с localStorage.
   */
  const syncCart = useCallback(
    (nextCart: CartApiResponse) => {
      const safeCart = isValidCartState(nextCart)
        ? nextCart
        : EMPTY_CART;

      setCart(safeCart);

      if (typeof window === "undefined") {
        return;
      }

      if (safeCart.cartId) {
        window.localStorage.setItem(
          STORAGE_KEY,
          safeCart.cartId
        );
      } else {
        window.localStorage.removeItem(
          STORAGE_KEY
        );
      }
    },
    []
  );

  /**
   * Сбрасывает корзину только на сайте.
   * Запрос в Shopify не отправляется.
   *
   * Используется перед переходом на checkout.
   */
  const resetLocalCart = useCallback(() => {
    setCart(EMPTY_CART);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }, []);

  /**
   * Получает актуальную корзину из Shopify.
   */
  const fetchCart = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (fetchInProgressRef.current) {
      return;
    }

    const storedId =
      window.localStorage.getItem(STORAGE_KEY);

    if (
      !storedId ||
      storedId === "undefined" ||
      storedId === "null"
    ) {
      syncCart(EMPTY_CART);
      return;
    }

    fetchInProgressRef.current = true;
    setIsLoading(true);

    try {
      const data = await callApi({
        action: "get",
        cartId: storedId,
      });

      if (
        !isValidCartState(data) ||
        !data.cartId
      ) {
        resetLocalCart();
        return;
      }

      syncCart(data);
    } catch (error: unknown) {
      console.error(
        "fetchCart error:",
        error instanceof Error
          ? error.message
          : String(error)
      );

      resetLocalCart();
    } finally {
      fetchInProgressRef.current = false;
      setIsLoading(false);
    }
  }, [resetLocalCart, syncCart]);

  const addToCart = useCallback(
    async (
      variantId: string,
      quantity = 1
    ) => {
      try {
        setIsLoading(true);

        const data = await callApi({
          action: "add",
          cartId:
            cart.cartId || undefined,
          variantId,
          quantity,
        });

        syncCart(data);
      } catch (error: unknown) {
        console.error(
          "addToCart error:",
          error instanceof Error
            ? error.message
            : String(error)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [cart.cartId, syncCart]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!cart.cartId) {
        return;
      }

      try {
        setIsLoading(true);

        const data = await callApi({
          action: "remove",
          cartId: cart.cartId,
          lineId,
        });

        syncCart(data);
      } catch (error: unknown) {
        console.error(
          "removeLine error:",
          error instanceof Error
            ? error.message
            : String(error)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [cart.cartId, syncCart]
  );

  const updateLineQuantity = useCallback(
    async (
      lineId: string,
      quantity: number
    ) => {
      if (!cart.cartId) {
        return;
      }

      if (quantity <= 0) {
        await removeLine(lineId);
        return;
      }

      try {
        setIsLoading(true);

        const data = await callApi({
          action: "update",
          cartId: cart.cartId,
          lineId,
          quantity,
        });

        syncCart(data);
      } catch (error: unknown) {
        console.error(
          "updateLineQuantity error:",
          error instanceof Error
            ? error.message
            : String(error)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      cart.cartId,
      removeLine,
      syncCart,
    ]
  );

  /**
   * Удаляет все линии из Shopify-корзины.
   * Использовать для кнопки «Очистить корзину».
   */
  const clearCart = useCallback(async () => {
    if (!cart.cartId) {
      resetLocalCart();
      return;
    }

    try {
      setIsLoading(true);

      const data = await callApi({
        action: "clear",
        cartId: cart.cartId,
      });

      if (
        !isValidCartState(data) ||
        data.lines.length === 0
      ) {
        resetLocalCart();
        return;
      }

      syncCart(data);
    } catch (error: unknown) {
      console.error(
        "clearCart error:",
        error instanceof Error
          ? error.message
          : String(error)
      );

      resetLocalCart();
    } finally {
      setIsLoading(false);
    }
  }, [
    cart.cartId,
    resetLocalCart,
    syncCart,
  ]);

  /**
   * Проверяем корзину:
   * - при первом открытии;
   * - после возвращения из Shopify;
   * - после переключения обратно на вкладку сайта.
   */
  useEffect(() => {
    const refreshCart = () => {
      void fetchCart();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        refreshCart();
      }
    };

    const timerId = window.setTimeout(
      refreshCart,
      0
    );

    window.addEventListener(
      "pageshow",
      refreshCart
    );

    window.addEventListener(
      "focus",
      refreshCart
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearTimeout(timerId);

      window.removeEventListener(
        "pageshow",
        refreshCart
      );

      window.removeEventListener(
        "focus",
        refreshCart
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [fetchCart]);

  const items = cart.lines;

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, line) =>
          sum +
          line.unitPrice *
            line.quantity,
        0
      ),
    [items]
  );

  const totalQuantity = useMemo(
    () =>
      items.reduce(
        (sum, line) =>
          sum + line.quantity,
        0
      ),
    [items]
  );

  const removeFromCart = useCallback(
    (lineId: string) =>
      removeLine(lineId),
    [removeLine]
  );

  const updateQuantity = useCallback(
    (
      lineId: string,
      quantity: number
    ) =>
      updateLineQuantity(
        lineId,
        quantity
      ),
    [updateLineQuantity]
  );

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      isLoading,
      addToCart,
      fetchCart,
      removeLine,
      updateLineQuantity,
      clearCart,
      resetLocalCart,
      items,
      totalPrice,
      removeFromCart,
      updateQuantity,
      totalQuantity,
    }),
    [
      cart,
      isLoading,
      addToCart,
      fetchCart,
      removeLine,
      updateLineQuantity,
      clearCart,
      resetLocalCart,
      items,
      totalPrice,
      removeFromCart,
      updateQuantity,
      totalQuantity,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used within a CartProvider"
    );
  }

  return context;
}