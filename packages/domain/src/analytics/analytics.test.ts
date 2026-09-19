import { describe, expect, it } from 'vitest';

import { orderAttributionSchema } from './types';
import { isInstagramTraffic, parseUtmParameters } from './utm';

describe('Analytics & Instagram Attribution Domain', () => {
  it('detects Instagram referrals from URL referrers and user-agents', () => {
    expect(isInstagramTraffic('https://l.instagram.com/')).toBe(true);
    expect(isInstagramTraffic('http://instagram.com/p/12345')).toBe(true);
    expect(isInstagramTraffic('https://ig.me/share')).toBe(true);
    expect(isInstagramTraffic(undefined, 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Instagram 280.0.0.17.112')).toBe(true);
    expect(isInstagramTraffic('https://google.com/search')).toBe(false);
    expect(isInstagramTraffic()).toBe(false);
  });

  it('parses full UTM parameters correctly', () => {
    const params = new URLSearchParams(
      'utm_source=instagram&utm_medium=story&utm_campaign=summer_tees_2026&utm_content=swipe_up_link&ref=AYESHA10'
    );

    const attr = parseUtmParameters(params, {
      referrer: 'https://l.instagram.com/',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      landingPage: '/products/artisanal-oversized-graphic-tee'
    });

    expect(attr.source).toBe('instagram');
    expect(attr.medium).toBe('story');
    expect(attr.campaign).toBe('summer_tees_2026');
    expect(attr.content).toBe('swipe_up_link');
    expect(attr.influencerCode).toBe('AYESHA10');
    expect(attr.deviceType).toBe('mobile');
    expect(attr.landingPage).toBe('/products/artisanal-oversized-graphic-tee');

    const validated = orderAttributionSchema.safeParse(attr);
    expect(validated.success).toBe(true);
  });

  it('infers Instagram source from referrer even when UTM tags are missing', () => {
    const params = new URLSearchParams('');
    const attr = parseUtmParameters(params, {
      referrer: 'https://l.instagram.com/'
    });

    expect(attr.source).toBe('instagram');
    expect(attr.medium).toBe('bio_or_story');
    expect(attr.referrer).toBe('https://l.instagram.com/');
  });

  it('defaults to direct traffic when no parameters or referrer are provided', () => {
    const params = new URLSearchParams('');
    const attr = parseUtmParameters(params);

    expect(attr.source).toBe('direct');
    expect(attr.medium).toBe('none');
    expect(attr.deviceType).toBe('unknown');
  });
});
