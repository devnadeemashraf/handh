import { describe, it, expect } from 'vitest';
import { Money } from './money';
import { ValidationError } from './errors';

describe('Money Value Object', () => {
  describe('creation and validation', () => {
    it('creates money from valid minor units', () => {
      const money = Money.fromMinor(59900, 'INR');
      expect(money.amountMinor).toBe(59900);
      expect(money.currency).toBe('INR');
      expect(money.toMajorString()).toBe('599.00');
    });

    it('rejects floating point numbers in fromMinor', () => {
      expect(() => Money.fromMinor(599.5, 'INR')).toThrow(ValidationError);
      expect(() => Money.fromMinor(NaN, 'INR')).toThrow(ValidationError);
      expect(() => Money.fromMinor(Infinity, 'INR')).toThrow(ValidationError);
    });

    it('safely parses major unit strings without floating-point inaccuracies', () => {
      const money = Money.fromMajor('19.99', 'INR');
      expect(money.amountMinor).toBe(1999);

      const money2 = Money.fromMajor('599', 'INR');
      expect(money2.amountMinor).toBe(59900);

      const money3 = Money.fromMajor('0.05', 'INR');
      expect(money3.amountMinor).toBe(5);
    });

    it('rejects invalid major unit inputs with excess precision', () => {
      expect(() => Money.fromMajor('19.999', 'INR')).toThrow(ValidationError);
      expect(() => Money.fromMajor('abc', 'INR')).toThrow(ValidationError);
    });
  });

  describe('arithmetic operations', () => {
    it('adds money correctly', () => {
      const a = Money.fromMinor(59900, 'INR');
      const b = Money.fromMinor(20000, 'INR');
      const result = a.add(b);
      expect(result.amountMinor).toBe(79900);
      expect(result.currency).toBe('INR');
    });

    it('subtracts money correctly', () => {
      const a = Money.fromMinor(59900, 'INR');
      const b = Money.fromMinor(20000, 'INR');
      const result = a.subtract(b);
      expect(result.amountMinor).toBe(39900);
    });

    it('throws when operating across different currencies', () => {
      const inr = Money.fromMinor(59900, 'INR');
      const usd = Money.fromMinor(59900, 'USD');
      expect(() => inr.add(usd)).toThrow(ValidationError);
      expect(() => inr.subtract(usd)).toThrow(ValidationError);
    });

    it('multiplies money with deterministic rounding', () => {
      const price = Money.fromMinor(59900, 'INR');
      const total = price.multiply(3);
      expect(total.amountMinor).toBe(179700);

      // Fractional factor rounding
      const discounted = price.multiply(0.85); // 15% discount: 59900 * 0.85 = 50915
      expect(discounted.amountMinor).toBe(50915);
    });

    it('allocates amounts without losing single paise to rounding', () => {
      // 100 paise allocated 1:1:1 -> 34, 33, 33 (Total = 100)
      const total = Money.fromMinor(100, 'INR');
      const split = total.allocate([1, 1, 1]);

      expect(split.length).toBe(3);
      expect(split[0]!.amountMinor).toBe(34);
      expect(split[1]!.amountMinor).toBe(33);
      expect(split[2]!.amountMinor).toBe(33);

      const sum = split.reduce((acc, m) => acc.add(m), Money.zero('INR'));
      expect(sum.amountMinor).toBe(100);
    });
  });

  describe('formatting and serialization', () => {
    it('formats into currency strings', () => {
      const money = Money.fromMinor(59900, 'INR');
      const formatted = money.format('en-IN');
      expect(formatted).toContain('599.00');
    });

    it('serializes to JSON correctly', () => {
      const money = Money.fromMinor(59900, 'INR');
      expect(money.toJSON()).toEqual({
        amountMinor: 59900,
        currency: 'INR'
      });
    });
  });
});
