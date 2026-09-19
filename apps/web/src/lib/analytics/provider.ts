export interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>): void;
  track(event: string, properties?: Record<string, unknown>): void;
  page(url?: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

class ConsoleAnalyticsAdapter implements AnalyticsProvider {
  private isDev = process.env.NODE_ENV !== 'production';

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (this.isDev) {
      console.log(`[Analytics:Identify] ${userId}`, traits ?? {});
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (this.isDev) {
      console.log(`[Analytics:Track] ${event}`, properties ?? {});
    }
  }

  page(url?: string, properties?: Record<string, unknown>): void {
    if (this.isDev) {
      console.log(
        `[Analytics:Page] ${url ?? (typeof window !== 'undefined' ? window.location.pathname : '')}`,
        properties ?? {}
      );
    }
  }

  reset(): void {
    if (this.isDev) {
      console.log('[Analytics:Reset]');
    }
  }
}

class PostHogAnalyticsAdapter implements AnalyticsProvider {
  private initialized = false;
  private posthogInstance: unknown = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    const apiKey = process.env['NEXT_PUBLIC_POSTHOG_KEY'];
    const host = process.env['NEXT_PUBLIC_POSTHOG_HOST'] || 'https://app.posthog.com';

    if (!apiKey) return;

    try {
      // Dynamic import / global posthog if available on window
      const globalPosthog = (
        window as unknown as {
          posthog?: {
            init: (key: string, opts: unknown) => void;
            identify: (id: string, t?: unknown) => void;
            capture: (e: string, p?: unknown) => void;
            reset: () => void;
          };
        }
      ).posthog;
      if (globalPosthog) {
        globalPosthog.init(apiKey, {
          api_host: host,
          autocapture: false,
          capture_pageview: false // We handle explicitly
        });
        this.posthogInstance = globalPosthog;
        this.initialized = true;
      }
    } catch (e) {
      console.warn('PostHog initialization failed:', e);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (this.initialized && this.posthogInstance) {
      (this.posthogInstance as { identify: (id: string, t?: unknown) => void }).identify(
        userId,
        traits
      );
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (this.initialized && this.posthogInstance) {
      (this.posthogInstance as { capture: (e: string, p?: unknown) => void }).capture(
        event,
        properties
      );
    }
  }

  page(url?: string, properties?: Record<string, unknown>): void {
    if (this.initialized && this.posthogInstance) {
      (this.posthogInstance as { capture: (e: string, p?: unknown) => void }).capture('$pageview', {
        $current_url: url ?? (typeof window !== 'undefined' ? window.location.href : ''),
        ...properties
      });
    }
  }

  reset(): void {
    if (this.initialized && this.posthogInstance) {
      (this.posthogInstance as { reset: () => void }).reset();
    }
  }
}

class CompositeAnalyticsProvider implements AnalyticsProvider {
  private providers: AnalyticsProvider[];

  constructor(providers: AnalyticsProvider[]) {
    this.providers = providers;
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    for (const p of this.providers) {
      p.identify(userId, traits);
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    for (const p of this.providers) {
      p.track(event, properties);
    }
  }

  page(url?: string, properties?: Record<string, unknown>): void {
    for (const p of this.providers) {
      p.page(url, properties);
    }
  }

  reset(): void {
    for (const p of this.providers) {
      p.reset();
    }
  }
}

let providerInstance: AnalyticsProvider | null = null;

export function getAnalyticsProvider(): AnalyticsProvider {
  if (!providerInstance) {
    const posthog = new PostHogAnalyticsAdapter();
    const consoleAdapter = new ConsoleAnalyticsAdapter();
    providerInstance = new CompositeAnalyticsProvider([consoleAdapter, posthog]);
  }
  return providerInstance;
}
