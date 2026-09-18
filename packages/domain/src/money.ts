import { ValidationError } from './errors';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

/**
 * Authoritative Money Value Object.
 * Enforces integer minor units (paise/cents) to prevent floating-point inaccuracies and revenue leakage.
 * All monetary operations are immutable.
 */
export class Money {
  public readonly amountMinor: number;
  public readonly currency: CurrencyCode;

  private constructor(amountMinor: number, currency: CurrencyCode) {
    if (!Number.isInteger(amountMinor) || !Number.isSafeInteger(amountMinor)) {
      throw new ValidationError(
        `Money amount must be a safe integer in minor units. Received: ${amountMinor}`,
        { amountMinor, currency }
      );
    }
    this.amountMinor = amountMinor;
    this.currency = currency;
  }

  /**
   * Create Money from integer minor units (e.g. 59900 paise = ₹599.00)
   */
  public static fromMinor(amountMinor: number, currency: CurrencyCode = 'INR'): Money {
    return new Money(amountMinor, currency);
  }

  /**
   * Create zero Money for a given currency
   */
  public static zero(currency: CurrencyCode = 'INR'): Money {
    return new Money(0, currency);
  }

  /**
   * Safely create Money from major units (e.g. "599.00" or 599) without floating-point drift.
   * Floating-point inputs with more than 2 decimal places will be rejected.
   */
  public static fromMajor(amountMajor: number | string, currency: CurrencyCode = 'INR'): Money {
    const strVal = typeof amountMajor === 'number' ? amountMajor.toString() : amountMajor.trim();

    if (!/^-?\d+(\.\d{1,2})?$/.test(strVal)) {
      throw new ValidationError(
        `Invalid major amount format: '${strVal}'. Expected integer or up to 2 decimal places.`,
        { amountMajor, currency }
      );
    }

    const isNegative = strVal.startsWith('-');
    const cleanStr = isNegative ? strVal.slice(1) : strVal;
    const parts = cleanStr.split('.');
    const integerPart = parts[0] ?? '0';
    const fractionalPart = (parts[1] ?? '').padEnd(2, '0');

    const minor = parseInt(integerPart, 10) * 100 + parseInt(fractionalPart, 10);
    const finalMinor = isNegative ? -minor : minor;

    return new Money(finalMinor, currency);
  }

  /**
   * Adds another Money instance. Currencies must match.
   */
  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  /**
   * Subtracts another Money instance. Currencies must match.
   */
  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  /**
   * Multiplies money by an integer or numeric factor with deterministic rounding.
   */
  public multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new ValidationError(`Multiplication factor must be finite. Received: ${factor}`, {
        factor
      });
    }
    const multiplied = Math.round(this.amountMinor * factor);
    return new Money(multiplied, this.currency);
  }

  /**
   * Allocates an amount across multiple integer ratios without losing single paise to rounding.
   * Fowler's allocation algorithm: distribute base proportions and allocate remainder 1 paisa at a time.
   */
  public allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) {
      throw new ValidationError('Allocation requires at least one ratio.');
    }

    let totalWeight = 0;
    for (const ratio of ratios) {
      if (ratio < 0 || !Number.isInteger(ratio)) {
        throw new ValidationError(
          `Allocation ratio must be a non-negative integer. Received: ${ratio}`
        );
      }
      totalWeight += ratio;
    }

    if (totalWeight === 0) {
      throw new ValidationError('Total allocation weight must be greater than zero.');
    }

    let remainder = this.amountMinor;
    const results: Money[] = [];

    for (const ratio of ratios) {
      const share = Math.floor((this.amountMinor * ratio) / totalWeight);
      results.push(new Money(share, this.currency));
      remainder -= share;
    }

    // Distribute remaining paise one-by-one to preserve exact total
    for (let i = 0; i < remainder; i++) {
      const current = results[i]!;
      results[i] = new Money(current.amountMinor + 1, this.currency);
    }

    return results;
  }

  public equals(other: Money): boolean {
    return this.amountMinor === other.amountMinor && this.currency === other.currency;
  }

  public isZero(): boolean {
    return this.amountMinor === 0;
  }

  public isPositive(): boolean {
    return this.amountMinor > 0;
  }

  public isNegative(): boolean {
    return this.amountMinor < 0;
  }

  public toMajorString(): string {
    const isNegative = this.amountMinor < 0;
    const absMinor = Math.abs(this.amountMinor);
    const integerPart = Math.floor(absMinor / 100).toString();
    const fractionalPart = (absMinor % 100).toString().padStart(2, '0');
    return `${isNegative ? '-' : ''}${integerPart}.${fractionalPart}`;
  }

  public format(locale = 'en-IN'): string {
    const majorAmount = this.amountMinor / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(majorAmount);
  }

  public toJSON(): { amountMinor: number; currency: CurrencyCode } {
    return {
      amountMinor: this.amountMinor,
      currency: this.currency
    };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Currency mismatch: cannot operate between '${this.currency}' and '${other.currency}'.`,
        { sourceCurrency: this.currency, targetCurrency: other.currency }
      );
    }
  }
}
