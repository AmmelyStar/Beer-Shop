// app/context/CartContext.tsx
"use client";
import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  ReactNode,
} from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageSrc: string;
  imageAlt: string;
  country?: string;
  size?: string;
  abv?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "shopping-cart";

// Кешируем значение чтобы избежать бесконечного цикла
let cachedItems: CartItem[] = [];
let listeners: Array<() => void> = [];

function getCartSnapshot(): CartItem[] {
  return cachedItems;
}

// Серверный snapshot — пустой массив, создаём один раз
const emptyCart: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return emptyCart;
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    cachedItems = stored ? JSON.parse(stored) : [];
  } catch {
    cachedItems = [];
  }
}

function saveToStorage(items: CartItem[]) {
  cachedItems = items;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  // Загружаем из localStorage при первой подписке
  if (listeners.length === 0) {
    loadFromStorage();
  }
  listeners.push(listener);

  // Слушаем изменения localStorage из других вкладок
  const handleStorage = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) {
      loadFromStorage();
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    subscribe,
    getCartSnapshot,
    getServerSnapshot
  );

  const addToCart = useCallback((newItem: Omit<CartItem, "quantity">) => {
    const existing = cachedItems.find((item) => item.id === newItem.id);
    if (existing) {
      saveToStorage(
        cachedItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      saveToStorage([...cachedItems, { ...newItem, quantity: 1 }]);
    }
  }, []);

  const removeFromCart = useCallback((id: string) => {
    saveToStorage(cachedItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(id);
        return;
      }
      saveToStorage(
        cachedItems.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    saveToStorage([]);
  }, []);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

// cachedItems — кешируем массив, getCartSnapshot всегда возвращает один и тот же объект
// emptyCart — серверный snapshot создаётся один раз, не на каждый вызов
// loadFromStorage() вызывается при первой подписке, не при каждом snapshot
// Бонус — добавил слушатель storage event, корзина синхронизируется между вкладками браузера!
