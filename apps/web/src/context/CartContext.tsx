'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { trackAddToCart } from '@/lib/analytics';

import type { CartItemInput, CartSummary } from '@hh/domain';

interface CartContextValue {
  items: CartItemInput[];
  cartSummary: CartSummary | null;
  isLoading: boolean;
  isOpen: boolean;
  totalItemCount: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const STORAGE_KEY = 'hh_guest_cart';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemInput[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const hasInitialValidatedRef = useRef(false);

  // 1. Hydrate cart from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItemInput[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Server reconciliation function — returns the validated CartSummary for downstream use
  const validateWithServer = useCallback(
    async (currentItems: CartItemInput[]): Promise<CartSummary | null> => {
      if (currentItems.length === 0) {
        const empty: CartSummary = {
          items: [],
          subtotalMinor: 0,
          currency: 'INR',
          totalQuantity: 0,
          isValidForCheckout: false
        };
        setCartSummary(empty);
        return empty;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/cart/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: currentItems })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.cart) {
            setCartSummary(data.cart);
            // Reconcile client storage if server modified item quantities (e.g. out-of-stock or cap) (E-COM-033)
            const serverItems: CartItemInput[] = (data.cart.items || []).map(
              (it: { variantId: string; effectiveQuantity?: number; quantity?: number }) => ({
                variantId: it.variantId,
                quantity: it.effectiveQuantity ?? it.quantity ?? 1
              })
            );
            const needsReconciliation =
              serverItems.length !== currentItems.length ||
              serverItems.some((sItem, idx) => {
                const cItem = currentItems[idx];
                return (
                  !cItem || cItem.variantId !== sItem.variantId || cItem.quantity !== sItem.quantity
                );
              });

            if (needsReconciliation) {
              setItems(serverItems);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(serverItems));
              } catch (e) {
                console.error('Failed to update localStorage cart:', e);
              }
            }
            return data.cart as CartSummary;
          }
        }
      } catch (e) {
        console.error('Failed to validate cart with server:', e);
      } finally {
        setIsLoading(false);
      }
      return null;
    },
    []
  );

  // 3. Persist and reconcile whenever items change (after initial hydration)
  const syncItems = useCallback(
    async (newItems: CartItemInput[]): Promise<CartSummary | null> => {
      setItems(newItems);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      } catch (e) {
        console.error('Failed to persist cart to localStorage:', e);
      }
      return validateWithServer(newItems);
    },
    [validateWithServer]
  );

  // Validate only once on initial client hydration (E-COM-146)
  useEffect(() => {
    if (isHydrated && !hasInitialValidatedRef.current) {
      hasInitialValidatedRef.current = true;
      if (items.length > 0) {
        void validateWithServer(items);
      }
    }
  }, [isHydrated, items, validateWithServer]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      const existingIndex = items.findIndex((i) => i.variantId === variantId);
      let updated: CartItemInput[];

      if (existingIndex > -1) {
        updated = items.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        );
      } else {
        updated = [...items, { variantId, quantity: Math.min(10, quantity) }];
      }

      const summary = await syncItems(updated);
      setIsOpen(true);

      // Fire add-to-cart telemetry using server-validated product data (E-COM-111)
      if (summary) {
        const addedItem = summary.items.find((it) => it.variantId === variantId);
        if (addedItem) {
          trackAddToCart({
            productId: addedItem.productId,
            variantId: addedItem.variantId,
            productName: addedItem.productTitle,
            quantity: addedItem.effectiveQuantity,
            priceMinor: addedItem.priceMinor
          });
        }
      }
    },
    [items, syncItems]
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        const updated = items.filter((i) => i.variantId !== variantId);
        await syncItems(updated);
      } else {
        const updated = items.map((item) =>
          item.variantId === variantId ? { ...item, quantity: Math.min(10, quantity) } : item
        );
        await syncItems(updated);
      }
    },
    [items, syncItems]
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      const updated = items.filter((i) => i.variantId !== variantId);
      await syncItems(updated);
    },
    [items, syncItems]
  );

  const clearCart = useCallback(() => {
    void syncItems([]);
  }, [syncItems]);

  const refreshCart = useCallback(async () => {
    await validateWithServer(items);
  }, [items, validateWithServer]);

  const totalItemCount = useMemo(() => {
    if (cartSummary) {
      return cartSummary.totalQuantity;
    }
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartSummary, items]);

  const value = useMemo(
    () => ({
      items,
      cartSummary,
      isLoading,
      isOpen,
      totalItemCount,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart
    }),
    [
      items,
      cartSummary,
      isLoading,
      isOpen,
      totalItemCount,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const DEFAULT_CART_CONTEXT: CartContextValue = {
  items: [],
  cartSummary: null,
  isLoading: false,
  isOpen: false,
  totalItemCount: 0,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: () => {},
  refreshCart: async () => {}
};

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  return context ?? DEFAULT_CART_CONTEXT;
}
