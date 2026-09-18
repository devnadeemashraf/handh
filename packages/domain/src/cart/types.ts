import { z } from 'zod';

export const CartItemInputSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10)
});

export type CartItemInput = z.infer<typeof CartItemInputSchema>;

export const CartValidationInputSchema = z.object({
  items: z.array(CartItemInputSchema).max(50)
});

export type CartValidationInput = z.infer<typeof CartValidationInputSchema>;

export type CartItemStatusNotice = 'ok' | 'out_of_stock' | 'quantity_reduced' | 'unavailable';

export interface CartItemDetail {
  variantId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  priceMinor: number;
  compareAtPriceMinor?: number | null | undefined;
  currency: string;
  primaryImageUrl?: string | null | undefined;
  availableQuantity: number;
  requestedQuantity: number;
  effectiveQuantity: number;
  lineTotalMinor: number;
  isAvailable: boolean;
  statusNotice?: CartItemStatusNotice | undefined;
}

export interface CartSummary {
  items: CartItemDetail[];
  subtotalMinor: number;
  currency: string;
  totalQuantity: number;
  isValidForCheckout: boolean;
}
