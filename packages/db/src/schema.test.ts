import { describe, expect, it } from 'vitest';

import {
  categories,
  fulfillments,
  inventoryLevels,
  inventoryReservations,
  orderItems,
  orders,
  outboxEvents,
  paymentAttempts,
  products,
  productVariants,
  stores,
  webhookEvents
} from './schema';

import type {
  Category,
  Fulfillment,
  FulfillmentStatus,
  InventoryLevel,
  Order,
  OrderItem,
  OrderStatus,
  OutboxEvent,
  PaymentAttempt,
  PaymentStatus,
  Product,
  ProductVariant,
  Store,
  WebhookEvent
} from './schema';

describe('Database Schema Definitions & Inferred Types', () => {
  describe('table definitions', () => {
    it('defines stores and categories with required core columns', () => {
      expect(stores.id).toBeDefined();
      expect(stores.slug).toBeDefined();
      expect(stores.defaultCurrency).toBeDefined();
      expect(stores.settings).toBeDefined();

      expect(categories.id).toBeDefined();
      expect(categories.storeId).toBeDefined();
      expect(categories.slug).toBeDefined();
    });

    it('defines products and variants with strict pricing columns', () => {
      expect(products.slug).toBeDefined();
      expect(products.status).toBeDefined();
      expect(productVariants.sku).toBeDefined();
      expect(productVariants.priceMinor).toBeDefined();
    });

    it('defines inventory levels with anti-overselling columns', () => {
      expect(inventoryLevels.onHand).toBeDefined();
      expect(inventoryLevels.reserved).toBeDefined();
      expect(inventoryReservations.expiresAt).toBeDefined();
    });

    it('defines orders and order items with decoupled state machine columns', () => {
      expect(orders.orderNumber).toBeDefined();
      expect(orders.status).toBeDefined();
      expect(orders.paymentStatus).toBeDefined();
      expect(orders.fulfillmentStatus).toBeDefined();
      expect(orders.totalMinor).toBeDefined();
      expect(orderItems.unitPriceMinor).toBeDefined();
      expect(orderItems.skuSnapshot).toBeDefined();
    });

    it('defines payment attempts and webhook idempotency columns', () => {
      expect(paymentAttempts.providerOrderId).toBeDefined();
      expect(paymentAttempts.amountMinor).toBeDefined();
      expect(webhookEvents.eventId).toBeDefined();
      expect(webhookEvents.provider).toBeDefined();
    });

    it('defines fulfillments and outbox tables', () => {
      expect(fulfillments.trackingNumber).toBeDefined();
      expect(fulfillments.trackingReference).toBeDefined();
      expect(outboxEvents.eventName).toBeDefined();
      expect(outboxEvents.scheduledAt).toBeDefined();
    });
  });

  describe('type compatibility', () => {
    it('verifies inferred types compile and type check properly', () => {
      const mockStore: Partial<Store> = {
        name: 'H&H Modest Wear',
        slug: 'modest-wear',
        defaultCurrency: 'INR',
        isActive: true
      };
      expect(mockStore.name).toBe('H&H Modest Wear');

      const mockCategory: Partial<Category> = {
        name: 'Accessories',
        slug: 'accessories',
        isActive: true
      };
      expect(mockCategory.name).toBe('Accessories');

      const mockProduct: Partial<Product> = {
        title: 'Pearl Nose Piece',
        slug: 'pearl-nose-piece',
        status: 'published'
      };
      expect(mockProduct.title).toBe('Pearl Nose Piece');

      const mockVariant: Partial<ProductVariant> = {
        sku: 'NP-PLG-01',
        title: 'Default',
        priceMinor: 59900
      };
      expect(mockVariant.sku).toBe('NP-PLG-01');

      const mockInventory: Partial<InventoryLevel> = {
        onHand: 5,
        reserved: 0
      };
      expect(mockInventory.onHand).toBe(5);

      const mockOrder: Partial<Order> = {
        orderNumber: 'HH-1001',
        status: 'pending_payment' as OrderStatus,
        paymentStatus: 'unpaid' as PaymentStatus,
        fulfillmentStatus: 'unfulfilled' as FulfillmentStatus,
        currency: 'INR',
        subtotalMinor: 59900,
        shippingMinor: 0,
        discountMinor: 0,
        totalMinor: 59900
      };
      expect(mockOrder.orderNumber).toBe('HH-1001');

      const mockItem: Partial<OrderItem> = {
        skuSnapshot: 'NP-PLG-01',
        productNameSnapshot: 'Pearl Gold Nose Piece',
        variantNameSnapshot: 'Default',
        unitPriceMinor: 59900,
        quantity: 1,
        totalPriceMinor: 59900
      };
      expect(mockItem.skuSnapshot).toBe('NP-PLG-01');

      const mockPaymentAttempt: Partial<PaymentAttempt> = {
        providerOrderId: 'order_test_123',
        amountMinor: 59900,
        status: 'initiated'
      };
      expect(mockPaymentAttempt.providerOrderId).toBe('order_test_123');

      const mockWebhook: Partial<WebhookEvent> = {
        provider: 'razorpay',
        eventId: 'evt_123',
        eventType: 'payment.captured',
        status: 'pending'
      };
      expect(mockWebhook.eventId).toBe('evt_123');

      const mockFulfillment: Partial<Fulfillment> = {
        courierProvider: 'dtdc',
        trackingNumber: 'DTDC12345678',
        trackingReference: 'ref_random_token_123'
      };
      expect(mockFulfillment.trackingReference).toBe('ref_random_token_123');

      const mockOutbox: Partial<OutboxEvent> = {
        eventName: 'order.paid',
        status: 'pending'
      };
      expect(mockOutbox.eventName).toBe('order.paid');
    });
  });
});
