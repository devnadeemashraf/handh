/**
 * Type-safe functional Result type for handling business operations without throwing exceptions.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  public readonly ok = true;
  public readonly err = false;

  constructor(public readonly value: T) {}

  public isOk(): this is Ok<T, E> {
    return true;
  }

  public isErr(): this is Err<T, E> {
    return false;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value));
  }

  public mapErr<F>(_fn: (err: E) => F): Result<T, F> {
    return new Ok<T, F>(this.value);
  }

  public flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  public unwrapOr(_fallback: T): T {
    return this.value;
  }
}

export class Err<T, E> {
  public readonly ok = false;
  public readonly err = true;

  constructor(public readonly error: E) {}

  public isOk(): this is Ok<T, E> {
    return false;
  }

  public isErr(): this is Err<T, E> {
    return true;
  }

  public map<U>(_fn: (val: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  public mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return new Err<T, F>(fn(this.error));
  }

  public flatMap<U>(_fn: (val: T) => Result<U, E>): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  public unwrapOr(fallback: T): T {
    return fallback;
  }
}

export const ok = <T, E = never>(value: T): Result<T, E> => new Ok<T, E>(value);
export const err = <T = never, E = unknown>(error: E): Result<T, E> => new Err<T, E>(error);
