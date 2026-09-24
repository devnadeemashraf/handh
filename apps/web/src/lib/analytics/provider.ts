import { posthog } from 'posthog-js';

export interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, unknown>): void;
  track(event: string, properties?: Record<string, unknown>): void;
  page(url?: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

export class ConsoleAnalyticsAdapter implements AnalyticsProvider {
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

export class PostHogAnalyticsAdapter implements AnalyticsProvider {
  private initialized = false;
  private posthogInstance: typeof posthog | null = null;

  constructor(customInstance?: typeof posthog, customKey?: string) {
    this.init(customInstance, customKey);
  }

  private init(customInstance?: typeof posthog, customKey?: string) {
    if (typeof window === 'undefined') return;
    const apiKey = customKey ?? process.env['NEXT_PUBLIC_POSTHOG_KEY'];
    const host = process.env['NEXT_PUBLIC_POSTHOG_HOST'] || 'https://app.posthog.com';

    if (!apiKey) return;

    try {
      const instance = customInstance ?? posthog;
      if (instance && typeof instance.init === 'function') {
        instance.init(apiKey, {
          api_host: host,
          autocapture: false,
          capture_pageview: false,
          persistence: 'localStorage+cookie'
        });
        this.posthogInstance = instance;
        this.initialized = true;
      }
    } catch (e) {
      console.warn('PostHog initialization failed:', e);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (this.initialized && this.posthogInstance) {
      this.posthogInstance.identify(userId, traits);
    }
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (this.initialized && this.posthogInstance) {
      this.posthogInstance.capture(event, properties);
    }
  }

  page(url?: string, properties?: Record<string, unknown>): void {
    if (this.initialized && this.posthogInstance) {
      this.posthogInstance.capture('$pageview', {
        $current_url: url ?? (typeof window !== 'undefined' ? window.location.href : ''),
        ...properties
      });
    }
  }

  reset(): void {
    if (this.initialized && this.posthogInstance) {
      this.posthogInstance.reset();
    }
  }
}

const SESSION_STORAGE_KEY = 'hh_analytics_session_id';
const ANONYMOUS_STORAGE_KEY = 'hh_analytics_anon_id';

function generateRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}

export class FirstPartyAnalyticsAdapter implements AnalyticsProvider {
  private sessionId: string | null = null;
  private anonymousId: string | null = null;
  private currentUserId: string | null = null;
  private beaconEndpoint: string;

  constructor(endpoint = '/api/analytics/events') {
    this.beaconEndpoint = endpoint;
  }

  private getSessionId(): string {
    if (this.sessionId) return this.sessionId;

    if (typeof window !== 'undefined') {
      try {
        const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          this.sessionId = stored;
          return stored;
        }
      } catch {
        // Storage access may be restricted in private browsing
      }
    }

    const generated = generateRandomId('sess');
    this.sessionId = generated;

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
      } catch {
        // Fallback in-memory
      }
    }
    return generated;
  }

  private getAnonymousId(): string {
    if (this.anonymousId) return this.anonymousId;

    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(ANONYMOUS_STORAGE_KEY);
        if (stored) {
          this.anonymousId = stored;
          return stored;
        }
      } catch {
        // Storage access restricted
      }
    }

    const generated = generateRandomId('anon');
    this.anonymousId = generated;

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ANONYMOUS_STORAGE_KEY, generated);
      } catch {
        // Fallback in-memory
      }
    }
    return generated;
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.currentUserId = userId;
    this.track('user_identified', traits);
  }

  track(event: string, properties?: Record<string, unknown>): void {
    const payload = {
      sessionId: this.getSessionId(),
      anonymousId: this.getAnonymousId(),
      userId: this.currentUserId ?? undefined,
      eventType: event,
      properties: properties ?? {},
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined
    };

    this.send(payload);
  }

  page(url?: string, properties?: Record<string, unknown>): void {
    this.track('page_viewed', {
      path: url ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      ...properties
    });
  }

  reset(): void {
    this.currentUserId = null;
    this.sessionId = null;
    this.anonymousId = null;

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        window.localStorage.removeItem(ANONYMOUS_STORAGE_KEY);
      } catch {
        // Best effort
      }
    }
  }

  private send(payload: Record<string, unknown>): void {
    const serialized = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([serialized], { type: 'application/json' });
        const sent = navigator.sendBeacon(this.beaconEndpoint, blob);
        if (sent) return;
      } catch {
        // sendBeacon failed, fall through to fetch
      }
    }

    if (typeof fetch === 'function') {
      fetch(this.beaconEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
        keepalive: true
      }).catch(() => {
        // Non-blocking telemetry drop
      });
    }
  }
}

export class CompositeAnalyticsProvider implements AnalyticsProvider {
  private providers: AnalyticsProvider[];

  constructor(providers: AnalyticsProvider[]) {
    this.providers = providers;
  }

  getProviders(): AnalyticsProvider[] {
    return [...this.providers];
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
    const consoleAdapter = new ConsoleAnalyticsAdapter();
    const firstParty = new FirstPartyAnalyticsAdapter();
    const posthogAdapter = new PostHogAnalyticsAdapter();
    providerInstance = new CompositeAnalyticsProvider([consoleAdapter, firstParty, posthogAdapter]);
  }
  return providerInstance;
}

export function resetAnalyticsProvider(): void {
  providerInstance = null;
}
