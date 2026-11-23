import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  farmer_id: string | null;
  farmer_name: string;
  crop_name: string;
  crop_name_te: string | null;
  variety?: string;
  district?: string;
  unit: string;
  price: number;
  image_url: string | null;
  quantity: number;
  location: string | null;
  is_demo?: boolean;
  supplier_verified?: boolean;
  price_verified?: boolean;
  stock_verified?: boolean;
  min_order?: number;
  pack_sizes?: number[];
  available_stock?: number;
};

type CartValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartValue | null>(null);
const KEY = "tf-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === item.product_id);
      if (found) {
        const packs = (item.pack_sizes ?? []).filter((size) => size <= (item.available_stock ?? Number.POSITIVE_INFINITY));
        const nextQuantity = packs.find((size) => size > found.quantity);
        if (nextQuantity === undefined) return prev;
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...item, quantity: nextQuantity } : i,
        );
      }
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        const packs = (item.pack_sizes ?? []).filter(
          (size) => size <= (item.available_stock ?? Number.POSITIVE_INFINITY),
        );
        if (packs.length === 0) return item;
        const quantity = packs.reduce((closest, size) =>
          Math.abs(size - qty) < Math.abs(closest - qty) ? size : closest,
        );
        return { ...item, quantity };
      }),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { items, add, remove, setQuantity, clear, subtotal, count: items.length };
  }, [items, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
