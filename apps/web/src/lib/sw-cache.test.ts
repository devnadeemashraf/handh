import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA Service Worker & Cache Strategy (E-COM-121, PWA-002)', () => {
  const swPath = path.resolve(__dirname, '../../public/sw.js');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  it('declares static and image cache versioning with bounded image retention', () => {
    expect(swContent).toContain("const CACHE_VERSION = 'v2';");
    expect(swContent).toContain('const STATIC_CACHE_NAME = `hh-static-${CACHE_VERSION}`;');
    expect(swContent).toContain('const IMAGE_CACHE_NAME = `hh-images-${CACHE_VERSION}`;');
    expect(swContent).toContain('const MAX_IMAGE_ENTRIES = 60;');
  });

  it('precaches essential PWA assets including offline shell and maskable icon', () => {
    expect(swContent).toContain("const OFFLINE_URL = '/offline';");
    expect(swContent).toContain("'/offline'");
    expect(swContent).toContain("'/manifest.webmanifest'");
    expect(swContent).toContain("'/icons/icon-maskable.png'");
  });

  it('implements bounded cache trimming helper function', () => {
    expect(swContent).toContain('async function trimCache(cacheName, maxEntries)');
    expect(swContent).toContain('cache.delete(request)');
  });

  it('intercepts /_next/image with stale-while-revalidate strategy (E-COM-121)', () => {
    expect(swContent).toContain("url.pathname.startsWith('/_next/image')");
    expect(swContent).toContain('caches.open(IMAGE_CACHE_NAME)');
    expect(swContent).toContain('trimCache(IMAGE_CACHE_NAME, MAX_IMAGE_ENTRIES)');
    expect(swContent).toContain('return cachedResponse || networkFetchPromise;');
  });

  it('handles navigation requests with network-first and offline fallback (PWA-002)', () => {
    expect(swContent).toContain("event.request.mode === 'navigate'");
    expect(swContent).toContain('cache.match(OFFLINE_URL)');
  });

  it('cleans up legacy caches during activation', () => {
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain('key !== STATIC_CACHE_NAME && key !== IMAGE_CACHE_NAME');
    expect(swContent).toContain('caches.delete(key)');
  });
});
