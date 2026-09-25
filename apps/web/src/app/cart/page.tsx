'use client';

import { CartView } from '@/components/cart/CartView';

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <CartView />
    </div>
  );
}
