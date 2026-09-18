/**
 * Base abstract domain error representing intentional business failures.
 * Internal diagnostic details must never be exposed to the customer directly.
 */
export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly userMessage: string;
  public readonly details?: unknown;

  constructor(message: string, userMessage: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly code = 'VALIDATION_ERROR';

  constructor(
    message: string,
    details?: unknown,
    userMessage = 'The provided information is invalid.'
  ) {
    super(message, userMessage, details);
  }
}

export class InsufficientInventoryError extends DomainError {
  public readonly code = 'INSUFFICIENT_INVENTORY';

  constructor(
    public readonly sku: string,
    public readonly requestedQuantity: number,
    public readonly availableQuantity: number,
    details?: unknown
  ) {
    super(
      `Insufficient inventory for SKU '${sku}'. Requested: ${requestedQuantity}, Available: ${availableQuantity}`,
      'One or more items in your cart are no longer available in the requested quantity.',
      details
    );
  }
}

export class InvalidStateTransitionError extends DomainError {
  public readonly code = 'INVALID_STATE_TRANSITION';

  constructor(
    public readonly entityName: string,
    public readonly fromState: string,
    public readonly toState: string,
    details?: unknown
  ) {
    super(
      `Invalid state transition for '${entityName}' from '${fromState}' to '${toState}'.`,
      'The requested operation cannot be performed in the current state.',
      details
    );
  }
}

export class PaymentVerificationError extends DomainError {
  public readonly code = 'PAYMENT_VERIFICATION_FAILED';

  constructor(message: string, details?: unknown) {
    super(
      message,
      'Payment verification failed. If your account was debited, please contact support.',
      details
    );
  }
}

export class PaymentAlreadyProcessedError extends DomainError {
  public readonly code = 'PAYMENT_ALREADY_PROCESSED';

  constructor(
    public readonly paymentAttemptId: string,
    details?: unknown
  ) {
    super(
      `Payment attempt '${paymentAttemptId}' has already been processed.`,
      'This payment has already been completed.',
      details
    );
  }
}

export class NotFoundError extends DomainError {
  public readonly code = 'NOT_FOUND';

  constructor(
    public readonly resource: string,
    public readonly identifier: string,
    details?: unknown
  ) {
    super(
      `${resource} with identifier '${identifier}' was not found.`,
      `${resource} was not found.`,
      details
    );
  }
}

export class ConflictError extends DomainError {
  public readonly code = 'CONFLICT';

  constructor(
    message: string,
    details?: unknown,
    userMessage = 'A conflicting record already exists.'
  ) {
    super(message, userMessage, details);
  }
}

export class UnauthorizedError extends DomainError {
  public readonly code = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized operation.', details?: unknown) {
    super(message, 'You are not authorized to perform this operation.', details);
  }
}
