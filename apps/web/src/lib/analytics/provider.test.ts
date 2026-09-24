import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { posthog } from 'posthog-js';

import {
  CompositeAnalyticsProvider,
  ConsoleAnalyticsAdapter,
  FirstPartyAnalyticsAdapter,
  getAnalyticsProvider,
  PostHogAnalyticsAdapter,
  resetAnalyticsProvider
} from './provider';

describe('Analytics Provider Architecture (E-COM-108, E-COM-109)', () => {
  beforeEach(() => {
    resetAnalyticsProvider();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  describe('PostHogAnalyticsAdapter (E-COM-108)', () => {
    it('does not initialize if NEXT_PUBLIC_POSTHOG_KEY is missing', () => {
      const mockPosthog = {
        init: vi.fn(),
        identify: vi.fn(),
        capture: vi.fn(),
        reset: vi.fn()
      };

      const adapter = new PostHogAnalyticsAdapter(
        mockPosthog as unknown as typeof posthog,
        undefined
      );
      expect(adapter.isInitialized()).toBe(false);
      expect(mockPosthog.init).not.toHaveBeenCalled();

      // Tracking calls should be safe no-ops
      adapter.track('test_event');
      adapter.identify('user_1');
      adapter.page('/test');
      adapter.reset();

      expect(mockPosthog.capture).not.toHaveBeenCalled();
      expect(mockPosthog.identify).not.toHaveBeenCalled();
      expect(mockPosthog.reset).not.toHaveBeenCalled();
    });

    it('initializes posthog SDK cleanly when API key is provided', () => {
      const mockPosthog = {
        init: vi.fn(),
        identify: vi.fn(),
        capture: vi.fn(),
        reset: vi.fn()
      };

      const adapter = new PostHogAnalyticsAdapter(
        mockPosthog as unknown as typeof posthog,
        'phc_test_key_123'
      );
      expect(adapter.isInitialized()).toBe(true);
      expect(mockPosthog.init).toHaveBeenCalledWith(
        'phc_test_key_123',
        expect.objectContaining({
          autocapture: false,
          capture_pageview: false,
          persistence: 'localStorage+cookie'
        })
      );

      adapter.track('product_viewed', { productId: 'p1' });
      expect(mockPosthog.capture).toHaveBeenCalledWith('product_viewed', { productId: 'p1' });

      adapter.identify('usr_999', { role: 'vip' });
      expect(mockPosthog.identify).toHaveBeenCalledWith('usr_999', { role: 'vip' });

      adapter.page('/products/abaya', { title: 'Abaya' });
      expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/products/abaya',
        title: 'Abaya'
      });

      adapter.reset();
      expect(mockPosthog.reset).toHaveBeenCalled();
    });
  });

  describe('FirstPartyAnalyticsAdapter (E-COM-109)', () => {
    it('generates, persists, and reuses sessionId and anonymousId', () => {
      const adapter = new FirstPartyAnalyticsAdapter();

      const sendBeaconMock = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        value: sendBeaconMock,
        configurable: true
      });

      adapter.track('page_viewed', { path: '/home' });

      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
      const [url, blob] = sendBeaconMock.mock.calls[0]!;
      expect(url).toBe('/api/analytics/events');
      expect(blob).toBeInstanceOf(Blob);

      const storedSession = window.sessionStorage.getItem('hh_analytics_session_id');
      const storedAnon = window.localStorage.getItem('hh_analytics_anon_id');
      expect(storedSession).toMatch(/^sess_/);
      expect(storedAnon).toMatch(/^anon_/);

      // Subsequent call reuses the same IDs
      adapter.track('cart_item_added', { sku: 'SKU-1' });
      expect(window.sessionStorage.getItem('hh_analytics_session_id')).toBe(storedSession);
      expect(window.localStorage.getItem('hh_analytics_anon_id')).toBe(storedAnon);
    });

    it('falls back to fetch with keepalive when sendBeacon fails or is unsupported', async () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        configurable: true
      });

      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
      global.fetch = fetchMock;

      const adapter = new FirstPartyAnalyticsAdapter('/api/analytics/events');
      adapter.track('customization_configured', { text: 'Nadeem' });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('clears session and anonymous storage on reset', () => {
      const adapter = new FirstPartyAnalyticsAdapter();
      adapter.track('page_viewed');

      expect(window.sessionStorage.getItem('hh_analytics_session_id')).not.toBeNull();
      expect(window.localStorage.getItem('hh_analytics_anon_id')).not.toBeNull();

      adapter.reset();
      expect(window.sessionStorage.getItem('hh_analytics_session_id')).toBeNull();
      expect(window.localStorage.getItem('hh_analytics_anon_id')).toBeNull();
    });
  });

  describe('CompositeAnalyticsProvider & getAnalyticsProvider', () => {
    it('dispatches tracking events across all registered adapters', () => {
      const mockAdapter1 = {
        identify: vi.fn(),
        track: vi.fn(),
        page: vi.fn(),
        reset: vi.fn()
      };
      const mockAdapter2 = {
        identify: vi.fn(),
        track: vi.fn(),
        page: vi.fn(),
        reset: vi.fn()
      };

      const composite = new CompositeAnalyticsProvider([mockAdapter1, mockAdapter2]);

      composite.identify('u1', { name: 'Ali' });
      expect(mockAdapter1.identify).toHaveBeenCalledWith('u1', { name: 'Ali' });
      expect(mockAdapter2.identify).toHaveBeenCalledWith('u1', { name: 'Ali' });

      composite.track('test', { key: 'val' });
      expect(mockAdapter1.track).toHaveBeenCalledWith('test', { key: 'val' });
      expect(mockAdapter2.track).toHaveBeenCalledWith('test', { key: 'val' });

      composite.page('/about');
      expect(mockAdapter1.page).toHaveBeenCalledWith('/about', undefined);
      expect(mockAdapter2.page).toHaveBeenCalledWith('/about', undefined);

      composite.reset();
      expect(mockAdapter1.reset).toHaveBeenCalled();
      expect(mockAdapter2.reset).toHaveBeenCalled();
    });

    it('getAnalyticsProvider returns a singleton composite with Console, FirstParty, and PostHog adapters', () => {
      const provider = getAnalyticsProvider() as CompositeAnalyticsProvider;
      expect(provider).toBeInstanceOf(CompositeAnalyticsProvider);

      const subProviders = provider.getProviders();
      expect(subProviders).toHaveLength(3);
      expect(subProviders.some((p) => p instanceof ConsoleAnalyticsAdapter)).toBe(true);
      expect(subProviders.some((p) => p instanceof FirstPartyAnalyticsAdapter)).toBe(true);
      expect(subProviders.some((p) => p instanceof PostHogAnalyticsAdapter)).toBe(true);

      // Verify singleton behavior
      const secondCall = getAnalyticsProvider();
      expect(secondCall).toBe(provider);
    });
  });
});
