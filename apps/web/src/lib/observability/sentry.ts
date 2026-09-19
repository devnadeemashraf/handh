export interface ErrorContext {
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorContext): void {
  const dsn =
    process.env['SENTRY_DSN'] ?? process.env['NEXT_PUBLIC_SENTRY_DSN'];

  if (!dsn) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Observability:Error]', error, context ?? {});
    }
    return;
  }

  try {
    const globalSentry = (
      globalThis as unknown as {
        Sentry?: {
          captureException: (err: unknown, opts?: unknown) => void;
        };
      }
    ).Sentry;

    if (globalSentry) {
      globalSentry.captureException(error, {
        user: context?.userId ? { id: context.userId } : undefined,
        tags: context?.tags,
        extra: context?.extra
      });
    }
  } catch (sentryErr) {
    console.warn('Failed to forward error to Sentry:', sentryErr);
  }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  const dsn =
    process.env['SENTRY_DSN'] ?? process.env['NEXT_PUBLIC_SENTRY_DSN'];

  if (!dsn) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Observability:${level.toUpperCase()}] ${message}`, context ?? {});
    }
    return;
  }

  try {
    const globalSentry = (
      globalThis as unknown as {
        Sentry?: {
          captureMessage: (msg: string, lvl?: string) => void;
        };
      }
    ).Sentry;

    if (globalSentry) {
      globalSentry.captureMessage(message, level);
    }
  } catch (sentryErr) {
    console.warn('Failed to forward message to Sentry:', sentryErr);
  }
}
