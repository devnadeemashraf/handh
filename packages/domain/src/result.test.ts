import { describe, expect, it } from 'vitest';

import { err, ok } from './result';

describe('Result Type', () => {
  it('handles Ok cases cleanly', () => {
    const res = ok<number, string>(42);
    expect(res.isOk()).toBe(true);
    expect(res.isErr()).toBe(false);

    if (res.isOk()) {
      expect(res.value).toBe(42);
    }

    const mapped = res.map((n) => n * 2);
    expect(mapped.unwrapOr(0)).toBe(84);
  });

  it('handles Err cases cleanly', () => {
    const res = err<number, string>('failed');
    expect(res.isOk()).toBe(false);
    expect(res.isErr()).toBe(true);

    if (res.isErr()) {
      expect(res.error).toBe('failed');
    }

    const fallback = res.unwrapOr(100);
    expect(fallback).toBe(100);
  });

  it('supports flatMap chaining', () => {
    const divide = (a: number, b: number) => {
      if (b === 0) return err('divide by zero');
      return ok(a / b);
    };

    const res = ok<number, string>(10)
      .flatMap((n) => divide(n, 2))
      .flatMap((n) => divide(n, 0));

    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBe('divide by zero');
    }
  });
});
