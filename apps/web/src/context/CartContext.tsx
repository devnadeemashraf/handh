'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

  // 2. Server reconciliation function
  const validateWithServer = useCallback(async (currentItems: CartItemInput[]) => {
    if (currentItems.length === 0) {
      setCartSummary({
        items: [],
        subtotalMinor: 0,
        currency: 'INR',
        totalQuantity: 0,
        isValidForCheckout: false
      });
      return;
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
        }
      }
    } catch (e) {
      console.error('Failed to validate cart with server:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Persist and reconcile whenever items change (after initial hydration)
  const syncItems = useCallback(
    async (newItems: CartItemInput[]) => {
      setItems(newItems);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      } catch (e) {
        console.error('Failed to persist cart to localStorage:', e);
      }
      await validateWithServer(newItems);
    },
    [validateWithServer]
  );

  // Validate on initial hydration
  useEffect(() => {
    if (isHydrated) {
      void validateWithServer(items);
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

      await syncItems(updated);
      setIsOpen(true);
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
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

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

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
