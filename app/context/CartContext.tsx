// app/context/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const SHOPIFY_CART_ID_KEY = "shopify-cart-id";

// Ответ API
type CartApiLine = {
  id: string;
  merchandiseId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  imageAlt: string;
};

type CartApiResponse = {
  cartId: string;
  checkoutUrl: string | null;
  lines: CartApiLine[];
};

type CartItem = {
  id: string; // CartLine.id
  merchandiseId: string; // Variant.id
  name: string;
  price: number;
  quantity: number;
  imageSrc: string;
  imageAlt: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalPrice: number;
  itemCount: number;
  loading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const callApi = async (
    path: string,
    body?: Record<string, unknown>
  ): Promise<CartApiResponse> => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await res.json();
      } catch {
        try {
          errorBody = await res.text();
        } catch {
          errorBody = null;
        }
      }

      console.error("Cart API error", res.status, errorBody);
      throw new Error("Cart API error");
    }

    const json = (await res.json()) as CartApiResponse;
    return {
      cartId: json.cartId,
      checkoutUrl: json.checkoutUrl ?? null,
      lines: json.lines ?? [],
    };
  };

  const mapLinesToItems = (lines: CartApiLine[] = []): CartItem[] =>
    lines.map((l) => ({
      id: l.id,
      merchandiseId: l.merchandiseId,
      name: l.title,
      price: l.unitPrice,
      quantity: l.quantity,
      imageSrc: l.imageUrl,
      imageAlt: l.imageAlt ?? l.title,
    }));

  // восстановление из localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SHOPIFY_CART_ID_KEY);
    if (stored) {
      setCartId(stored);
      void fetchCart(stored);
    }
  }, []);

  const fetchCart = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await callApi("/api/cart", {
        action: "get",
        cartId: id,
      });

      setCartId(data.cartId);
      setCheckoutUrl(data.checkoutUrl);
      setItems(mapLinesToItems(data.lines));

      window.localStorage.setItem(SHOPIFY_CART_ID_KEY, data.cartId);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureCart = useCallback(async () => {
    if (cartId) return cartId;

    setLoading(true);
    try {
      const data = await callApi("/api/cart", { action: "create" });

      setCartId(data.cartId);
      setCheckoutUrl(data.checkoutUrl);
      setItems(mapLinesToItems(data.lines));

      window.localStorage.setItem(SHOPIFY_CART_ID_KEY, data.cartId);
      return data.cartId;
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true);
      try {
        // если корзины нет – создаём (через action:"create")
        const id = await ensureCart();

        const data = await callApi("/api/cart", {
          action: "add",
          cartId: id,
          variantId,
          quantity,
        });

        setCartId(data.cartId);
        setCheckoutUrl(data.checkoutUrl);
        setItems(mapLinesToItems(data.lines));
      } finally {
        setLoading(false);
      }
    },
    [ensureCart]
  );

  const removeFromCart = useCallback(
    async (lineId: string) => {
      if (!cartId) return;

      setLoading(true);
      try {
        const data = await callApi("/api/cart", {
          action: "remove",
          cartId,
          lineId,
        });

        setCartId(data.cartId);
        setCheckoutUrl(data.checkoutUrl);
        setItems(mapLinesToItems(data.lines));
      } finally {
        setLoading(false);
      }
    },
    [cartId]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cartId) return;
      if (quantity < 1) {
        await removeFromCart(lineId);
        return;
      }

      setLoading(true);
      try {
        const data = await callApi("/api/cart", {
          action: "update",
          cartId,
          lineId,
          quantity,
        });

        setCartId(data.cartId);
        setCheckoutUrl(data.checkoutUrl);
        setItems(mapLinesToItems(data.lines));
      } finally {
        setLoading(false);
      }
    },
    [cartId, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    if (!cartId) return;

    setLoading(true);
    try {
      const data = await callApi("/api/cart", {
        action: "clear",
        cartId,
      });

        setCartId(data.cartId);
        setCheckoutUrl(data.checkoutUrl);
        setItems(mapLinesToItems(data.lines));
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        itemCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
