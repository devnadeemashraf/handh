import { beforeEach, describe, expect, it } from 'vitest';

import {
  captureAttributionFromBrowser,
  clearStoredAttribution,
  getStoredAttribution
} from './attribution';

describe('Analytics Attribution Library', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Clear URL params
    window.history.replaceState({}, '', '/');
  });

  it('captures UTM parameters from browser URL and persists them', () => {
    window.history.replaceState(
      {},
      '',
      '/?utm_source=instagram&utm_medium=bio_link&utm_campaign=summer_launch&utm_content=abaya_reel'
    );

    const captured = captureAttributionFromBrowser();
    expect(captured).not.toBeNull();
    expect(captured?.source).toBe('instagram');
    expect(captured?.medium).toBe('bio_link');
    expect(captured?.campaign).toBe('summer_launch');
    expect(captured?.content).toBe('abaya_reel');

    // Check retrieval
    const retrieved = getStoredAttribution();
    expect(retrieved?.campaign).toBe('summer_launch');
  });

  it('detects Instagram in-app browser without explicit UTM tags', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0.0',
      configurable: true
    });

    const captured = captureAttributionFromBrowser();
    expect(captured).not.toBeNull();
    expect(captured?.source).toBe('instagram');
    expect(captured?.medium).toBe('bio_or_story');
  });

  it('clears stored attribution', () => {
    window.history.replaceState({}, '', '/?utm_source=google&utm_medium=cpc');
    captureAttributionFromBrowser();
    expect(getStoredAttribution()).not.toBeNull();

    clearStoredAttribution();
    expect(getStoredAttribution()).toBeNull();
  });
});
