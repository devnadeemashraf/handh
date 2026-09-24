import { InvalidStateTransitionError } from './errors';

export type OrderStatus =
  'pending_payment' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export type PaymentStatus = 'unpaid' | 'authorized' | 'captured' | 'failed' | 'refunded';

export type FulfillmentStatus =
  'unfulfilled' | 'partially_fulfilled' | 'shipped' | 'delivered' | 'returned';

export type ReservationStatus = 'active' | 'consumed' | 'released';

export type WebhookStatus = 'pending' | 'processed' | 'failed' | 'ignored';

/**
 * Valid state transitions for Orders.
 * Prevents illegal state jumps (e.g. Completed -> Pending Payment).
 */
export const VALID_ORDER_TRANSITIONS: Readonly<Record<OrderStatus, ReadonlySet<OrderStatus>>> = {
  pending_payment: new Set(['paid', 'cancelled']),
  paid: new Set(['processing', 'cancelled', 'refunded']),
  processing: new Set(['completed', 'cancelled', 'refunded']),
  completed: new Set(['refunded']),
  cancelled: new Set([]), // Terminal state
  refunded: new Set([]) // Terminal state
};

/**
 * Valid state transitions for Payments.
 */
export const VALID_PAYMENT_TRANSITIONS: Readonly<
  Record<PaymentStatus, ReadonlySet<PaymentStatus>>
> = {
  unpaid: new Set(['authorized', 'captured', 'failed']),
  authorized: new Set(['captured', 'failed']),
  captured: new Set(['refunded']),
  failed: new Set(['authorized', 'captured']), // Retry attempt can succeed
  refunded: new Set([]) // Terminal state
};

/**
 * Valid state transitions for Inventory Reservations.
 */
export const VALID_RESERVATION_TRANSITIONS: Readonly<
  Record<ReservationStatus, ReadonlySet<ReservationStatus>>
> = {
  active: new Set(['consumed', 'released']),
  consumed: new Set([]), // Terminal state
  released: new Set([]) // Terminal state
};

/**
 * Valid state transitions for Fulfillments.
 */
export const VALID_FULFILLMENT_TRANSITIONS: Readonly<
  Record<FulfillmentStatus, ReadonlySet<FulfillmentStatus>>
> = {
  unfulfilled: new Set(['partially_fulfilled', 'shipped']),
  partially_fulfilled: new Set(['shipped']),
  shipped: new Set(['delivered', 'returned']),
  delivered: new Set(['returned']),
  returned: new Set([]) // Terminal state
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_ORDER_TRANSITIONS[from].has(to);
}

export function assertCanTransitionOrder(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new InvalidStateTransitionError('Order', from, to);
  }
}

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return VALID_PAYMENT_TRANSITIONS[from].has(to);
}

export function assertCanTransitionPayment(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransitionPayment(from, to)) {
    throw new InvalidStateTransitionError('Payment', from, to);
  }
}

export function canTransitionReservation(from: ReservationStatus, to: ReservationStatus): boolean {
  return VALID_RESERVATION_TRANSITIONS[from].has(to);
}

export function assertCanTransitionReservation(
  from: ReservationStatus,
  to: ReservationStatus
): void {
  if (!canTransitionReservation(from, to)) {
    throw new InvalidStateTransitionError('InventoryReservation', from, to);
  }
}

export function canTransitionFulfillment(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  return VALID_FULFILLMENT_TRANSITIONS[from].has(to);
}

export function assertCanTransitionFulfillment(
  from: FulfillmentStatus,
  to: FulfillmentStatus
): void {
  if (!canTransitionFulfillment(from, to)) {
    throw new InvalidStateTransitionError('Fulfillment', from, to);
  }
}
