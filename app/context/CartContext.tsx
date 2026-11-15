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

export type DeliveryQuoteStatus =
  | "none"
  | "pending"
  | "paid";

type DeliveryQuoteStatusResponse = {
  status: DeliveryQuoteStatus;
  requestNumber: string | null;
};

type CartContextType = {
  cart: CartState;
  isLoading: boolean;

  deliveryQuoteStatus:
    DeliveryQuoteStatus;

  deliveryQuoteRequestNumber:
    string | null;

  isCartLocked: boolean;

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

  resetLocalCart: () => void;

  refreshDeliveryQuoteStatus:
    () => Promise<void>;

  markDeliveryQuotePending: (
    requestNumber: string
  ) => void;

  totalQuantity: number;

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

async function callCartApi(
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

async function getDeliveryQuoteStatus(
  cartId: string
): Promise<DeliveryQuoteStatusResponse> {
  const response = await fetch(
    `/api/delivery-quote?cartId=${encodeURIComponent(
      cartId
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      // Ответ может быть не JSON
    }

    console.error(
      "Delivery quote status error:",
      response.status,
      errorBody
    );

    throw new Error(
      `Delivery quote status error: ${response.status}`
    );
  }

  const data =
    (await response.json()) as Partial<DeliveryQuoteStatusResponse>;

  const status: DeliveryQuoteStatus =
    data.status === "pending" ||
    data.status === "paid"
      ? data.status
      : "none";

  return {
    status,
    requestNumber:
      typeof data.requestNumber === "string"
        ? data.requestNumber
        : null,
  };
}

function isValidCartState(
  value: CartApiResponse
): value is CartState {
  return Boolean(
    value &&
      typeof value.cartId === "string" &&
      typeof value.checkoutUrl !==
        "undefined" &&
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

  const [
    deliveryQuoteStatus,
    setDeliveryQuoteStatus,
  ] =
    useState<DeliveryQuoteStatus>("none");

  const [
    deliveryQuoteRequestNumber,
    setDeliveryQuoteRequestNumber,
  ] = useState<string | null>(null);

  const fetchInProgressRef = useRef(false);

  const isCartLocked =
    deliveryQuoteStatus === "pending";

  const syncCart = useCallback(
    (nextCart: CartApiResponse) => {
      const safeCart = isValidCartState(
        nextCart
      )
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

  /*
   * Очищает только состояние сайта
   * и сохранённый cartId.
   */
  const resetLocalCart = useCallback(() => {
    setCart(EMPTY_CART);
    setDeliveryQuoteStatus("none");
    setDeliveryQuoteRequestNumber(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }, []);

  /*
   * Проверяет, существует ли для корзины
   * запрос индивидуальной доставки.
   *
   * Если Draft Order уже оплачен,
   * очищает исходную Shopify-корзину.
   */
  const checkQuoteForCart = useCallback(
    async (cartId: string) => {
      try {
        const quote =
          await getDeliveryQuoteStatus(
            cartId
          );

        if (quote.status === "paid") {
          /*
           * Счёт оплачен — удаляем товары
           * из исходной Shopify-корзины.
           */
          try {
            await callCartApi({
              action: "clear",
              cartId,
            });
          } catch (error: unknown) {
            /*
             * Если Shopify уже удалил корзину,
             * локальный cartId всё равно
             * необходимо убрать.
             */
            console.warn(
              "Paid cart clearing warning:",
              error instanceof Error
                ? error.message
                : String(error)
            );
          }

          resetLocalCart();
          return;
        }

        setDeliveryQuoteStatus(
          quote.status
        );

        setDeliveryQuoteRequestNumber(
          quote.requestNumber
        );
      } catch (error: unknown) {
        /*
         * Ошибка проверки Draft Order
         * не должна удалять корзину.
         */
        console.error(
          "checkQuoteForCart error:",
          error instanceof Error
            ? error.message
            : String(error)
        );
      }
    },
    [resetLocalCart]
  );

  const fetchCart = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (fetchInProgressRef.current) {
      return;
    }

    const storedId =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      !storedId ||
      storedId === "undefined" ||
      storedId === "null"
    ) {
      syncCart(EMPTY_CART);
      setDeliveryQuoteStatus("none");
      setDeliveryQuoteRequestNumber(null);
      return;
    }

    fetchInProgressRef.current = true;
    setIsLoading(true);

    try {
      const data = await callCartApi({
        action: "get",
        cartId: storedId,
      });

      /*
       * После обычной успешной оплаты
       * Shopify удаляет завершённую корзину.
       */
      if (
        !isValidCartState(data) ||
        !data.cartId
      ) {
        resetLocalCart();
        return;
      }

      syncCart(data);

      await checkQuoteForCart(
        data.cartId
      );
    } catch (error: unknown) {
      console.error(
        "fetchCart error:",
        error instanceof Error
          ? error.message
          : String(error)
      );

      /*
       * Старый cartId больше не существует.
       */
      resetLocalCart();
    } finally {
      fetchInProgressRef.current = false;
      setIsLoading(false);
    }
  }, [
    checkQuoteForCart,
    resetLocalCart,
    syncCart,
  ]);

  const refreshDeliveryQuoteStatus =
    useCallback(async () => {
      if (!cart.cartId) {
        setDeliveryQuoteStatus("none");
        setDeliveryQuoteRequestNumber(
          null
        );
        return;
      }

      await checkQuoteForCart(
        cart.cartId
      );
    }, [
      cart.cartId,
      checkQuoteForCart,
    ]);

  const markDeliveryQuotePending =
    useCallback(
      (requestNumber: string) => {
        setDeliveryQuoteStatus(
          "pending"
        );

        setDeliveryQuoteRequestNumber(
          requestNumber || null
        );
      },
      []
    );

  const addToCart = useCallback(
    async (
      variantId: string,
      quantity = 1
    ) => {
      /*
       * После отправки запроса содержимое
       * корзины менять нельзя: Draft Order
       * уже содержит зафиксированный список.
       */
      if (isCartLocked) {
        console.warn(
          "Cart is locked while the delivery quote is pending"
        );
        return;
      }

      try {
        setIsLoading(true);

        const data = await callCartApi({
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
    [
      cart.cartId,
      isCartLocked,
      syncCart,
    ]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (
        !cart.cartId ||
        isCartLocked
      ) {
        return;
      }

      try {
        setIsLoading(true);

        const data = await callCartApi({
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
    [
      cart.cartId,
      isCartLocked,
      syncCart,
    ]
  );

  const updateLineQuantity =
    useCallback(
      async (
        lineId: string,
        quantity: number
      ) => {
        if (
          !cart.cartId ||
          isCartLocked
        ) {
          return;
        }

        if (quantity <= 0) {
          await removeLine(lineId);
          return;
        }

        try {
          setIsLoading(true);

          const data =
            await callCartApi({
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
        isCartLocked,
        removeLine,
        syncCart,
      ]
    );

  const clearCart = useCallback(async () => {
    /*
     * Запрос уже отправлен — сохраняем
     * корзину до оплаты счёта.
     */
    if (isCartLocked) {
      console.warn(
        "A pending delivery request cannot be cleared"
      );
      return;
    }

    if (!cart.cartId) {
      resetLocalCart();
      return;
    }

    try {
      setIsLoading(true);

      const data = await callCartApi({
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
    isCartLocked,
    resetLocalCart,
    syncCart,
  ]);

  /*
   * Проверяем корзину:
   * - при первом открытии;
   * - после возвращения из Shopify;
   * - при возвращении на вкладку сайта.
   */
  useEffect(() => {
    const refreshCart = () => {
      void fetchCart();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
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
      deliveryQuoteStatus,
      deliveryQuoteRequestNumber,
      isCartLocked,
      addToCart,
      fetchCart,
      removeLine,
      updateLineQuantity,
      clearCart,
      resetLocalCart,
      refreshDeliveryQuoteStatus,
      markDeliveryQuotePending,
      items,
      totalPrice,
      removeFromCart,
      updateQuantity,
      totalQuantity,
    }),
    [
      cart,
      isLoading,
      deliveryQuoteStatus,
      deliveryQuoteRequestNumber,
      isCartLocked,
      addToCart,
      fetchCart,
      removeLine,
      updateLineQuantity,
      clearCart,
      resetLocalCart,
      refreshDeliveryQuoteStatus,
      markDeliveryQuotePending,
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
  const context = useContext(
    CartContext
  );

  if (!context) {
    throw new Error(
      "useCart must be used within a CartProvider"
    );
  }

  return context;
}