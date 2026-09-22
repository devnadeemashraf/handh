import { describe, expect, it } from 'vitest';

import { calculateCheckoutFinancials, generateOrderNumber } from './calculations';
import {
  CheckoutSubmissionSchema,
  IndianPhoneSchema,
  IndianPostalCodeSchema,
  ShippingAddressSchema
} from './types';

describe('Checkout Domain Validation', () => {
  it('validates 10-digit Indian mobile numbers and normalizes to canonical +91 format', () => {
    expect(IndianPhoneSchema.parse('9876543210')).toBe('+919876543210');
    expect(IndianPhoneSchema.parse('8123456789')).toBe('+918123456789');
    expect(IndianPhoneSchema.parse('7000000000')).toBe('+917000000000');
    expect(IndianPhoneSchema.parse('6234567890')).toBe('+916234567890');
    expect(IndianPhoneSchema.parse('+919876543210')).toBe('+919876543210');

    // Invalid phones
    expect(() => IndianPhoneSchema.parse('1234567890')).toThrow();
    expect(() => IndianPhoneSchema.parse('987654321')).toThrow(); // 9 digits
    expect(() => IndianPhoneSchema.parse('98765432100')).toThrow(); // 11 digits
    expect(() => IndianPhoneSchema.parse('98765ABCD0')).toThrow();
  });

  it('validates 6-digit Indian PIN codes', () => {
    expect(IndianPostalCodeSchema.parse('110001')).toBe('110001');
    expect(IndianPostalCodeSchema.parse('560001')).toBe('560001');

    // Invalid PIN codes
    expect(() => IndianPostalCodeSchema.parse('11000')).toThrow();
    expect(() => IndianPostalCodeSchema.parse('1100001')).toThrow();
    expect(() => IndianPostalCodeSchema.parse('11000A')).toThrow();
  });

  it('validates complete Indian shipping address with both raw 10-digit and +91 phone numbers', () => {
    const rawPhoneAddress = {
      fullName: 'Fatima Khan',
      phone: '9876543210',
      email: 'fatima@example.com',
      line1: 'Flat 402, Royale Apartments',
      line2: 'Opposite Jamia Masjid',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'IN' as const
    };

    expect(ShippingAddressSchema.parse(rawPhoneAddress)).toEqual({
      ...rawPhoneAddress,
      phone: '+919876543210'
    });

    const prefilledPhoneAddress = {
      ...rawPhoneAddress,
      phone: '+919876543210'
    };

    expect(ShippingAddressSchema.parse(prefilledPhoneAddress)).toEqual({
      ...prefilledPhoneAddress,
      phone: '+919876543210'
    });
  });

  it('validates full checkout submission payload', () => {
    const validSubmission = {
      items: [
        {
          variantId: '11111111-1111-1111-1111-111111111111',
          quantity: 2
        }
      ],
      shippingAddress: {
        fullName: 'Zainab Ahmed',
        phone: '9876543210',
        email: 'zainab@example.com',
        line1: 'House 12, Rose Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN' as const
      },
      customerNotes: 'Please call before delivery',
      idempotencyKey: '22222222-2222-2222-2222-222222222222'
    };

    expect(CheckoutSubmissionSchema.parse(validSubmission)).toBeDefined();
  });

  it('rejects checkout submission with empty items or missing idempotency key', () => {
    const base = {
      items: [],
      shippingAddress: {
        fullName: 'Zainab Ahmed',
        phone: '9876543210',
        email: 'zainab@example.com',
        line1: 'House 12, Rose Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN' as const
      },
      idempotencyKey: '22222222-2222-2222-2222-222222222222'
    };

    expect(() => CheckoutSubmissionSchema.parse(base)).toThrow();
    expect(() =>
      CheckoutSubmissionSchema.parse({
        ...base,
        items: [{ variantId: '11111111-1111-1111-1111-111111111111', quantity: 1 }],
        idempotencyKey: 'not-a-uuid'
      })
    ).toThrow();
  });
});

describe('Checkout Financial Calculations', () => {
  it('charges standard courier fee when subtotal is below free shipping threshold', () => {
    // ₹599 subtotal (< ₹999 threshold)
    const breakdown = calculateCheckoutFinancials(59900, 'INR');

    expect(breakdown.subtotalMinor).toBe(59900);
    expect(breakdown.shippingMinor).toBe(9900); // ₹99
    expect(breakdown.totalMinor).toBe(69800); // ₹698.00
    expect(breakdown.isFreeDelivery).toBe(false);
    expect(breakdown.remainingForFreeDeliveryMinor).toBe(40000); // ₹400 more needed
  });

  it('grants free delivery when subtotal reaches or exceeds threshold', () => {
    // Exactly ₹999 threshold
    const atThreshold = calculateCheckoutFinancials(99900, 'INR');
    expect(atThreshold.shippingMinor).toBe(0);
    expect(atThreshold.totalMinor).toBe(99900);
    expect(atThreshold.isFreeDelivery).toBe(true);
    expect(atThreshold.remainingForFreeDeliveryMinor).toBe(0);

    // Well above threshold: 2 pieces @ ₹799 = ₹1598
    const aboveThreshold = calculateCheckoutFinancials(159800, 'INR');
    expect(aboveThreshold.shippingMinor).toBe(0);
    expect(aboveThreshold.totalMinor).toBe(159800);
    expect(aboveThreshold.isFreeDelivery).toBe(true);
  });

  it('correctly applies discount in minor units', () => {
    const breakdown = calculateCheckoutFinancials(59900, 'INR', {
      discountMinor: 10000 // ₹100 coupon
    });

    // 59900 subtotal + 9900 shipping - 10000 discount = 59800
    expect(breakdown.discountMinor).toBe(10000);
    expect(breakdown.totalMinor).toBe(59800);
  });

  it('generates consistent order number format', () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^HH-\d{4}-[A-Z0-9]{5}$/);
  });
});
