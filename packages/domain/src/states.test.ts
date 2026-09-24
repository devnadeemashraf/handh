import { describe, expect, it } from 'vitest';

import { InvalidStateTransitionError } from './errors';
import {
  assertCanTransitionOrder,
  assertCanTransitionPayment,
  assertCanTransitionReservation,
  canTransitionFulfillment,
  canTransitionOrder,
  canTransitionPayment,
  canTransitionReservation
} from './states';

describe('State Machine Transitions', () => {
  describe('Order state transitions', () => {
    it('allows valid order progression', () => {
      expect(canTransitionOrder('pending_payment', 'paid')).toBe(true);
      expect(canTransitionOrder('paid', 'processing')).toBe(true);
      expect(canTransitionOrder('processing', 'completed')).toBe(true);
      expect(canTransitionOrder('completed', 'refunded')).toBe(true);
    });

    it('blocks illegal order regressions', () => {
      expect(canTransitionOrder('completed', 'pending_payment')).toBe(false);
      expect(canTransitionOrder('cancelled', 'paid')).toBe(false);
      expect(() => assertCanTransitionOrder('completed', 'pending_payment')).toThrow(
        InvalidStateTransitionError
      );
    });
  });

  describe('Payment state transitions', () => {
    it('allows payment authorization and capture', () => {
      expect(canTransitionPayment('unpaid', 'authorized')).toBe(true);
      expect(canTransitionPayment('authorized', 'captured')).toBe(true);
      expect(canTransitionPayment('captured', 'refunded')).toBe(true);
    });

    it('blocks invalid payment jumps', () => {
      expect(canTransitionPayment('refunded', 'captured')).toBe(false);
      expect(() => assertCanTransitionPayment('refunded', 'captured')).toThrow(
        InvalidStateTransitionError
      );
    });
  });

  describe('Reservation transitions', () => {
    it('allows active reservation consumption or release', () => {
      expect(canTransitionReservation('active', 'consumed')).toBe(true);
      expect(canTransitionReservation('active', 'released')).toBe(true);
    });

    it('blocks transitioning already consumed reservations', () => {
      expect(canTransitionReservation('consumed', 'released')).toBe(false);
      expect(() => assertCanTransitionReservation('consumed', 'released')).toThrow(
        InvalidStateTransitionError
      );
    });
  });

  describe('Fulfillment state transitions (E-COM-064)', () => {
    it('allows standard forward progression to delivered and return', () => {
      expect(canTransitionFulfillment('unfulfilled', 'shipped')).toBe(true);
      expect(canTransitionFulfillment('shipped', 'delivered')).toBe(true);
      expect(canTransitionFulfillment('shipped', 'returned')).toBe(true);
      expect(canTransitionFulfillment('delivered', 'returned')).toBe(true);
    });

    it('blocks illegal fulfillment regressions', () => {
      expect(canTransitionFulfillment('returned', 'shipped')).toBe(false);
      expect(canTransitionFulfillment('returned', 'delivered')).toBe(false);
      expect(canTransitionFulfillment('delivered', 'shipped')).toBe(false);
    });
  });
});
