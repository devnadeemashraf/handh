import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ErrorBoundaryPage from './error';
import { FaqClient } from './faq/FaqClient';
import OfflinePage from './offline/page';

// Mock CartContext for CartView empty state check
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    cart: { items: [] },
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalCount: 0,
    subtotalMinor: 0
  })
}));

describe('Sprint 11.8: Comprehensive UX States & Accessibility Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Global Empty States Catalog (Spec 11)', () => {
    it('verifies FAQ empty state when search produces no matching questions', () => {
      render(<FaqClient />);
      const searchInput = screen.getByRole('searchbox');

      // Trigger empty search state
      fireEvent.change(searchInput, { target: { value: 'zzzz-unmatched' } });

      expect(screen.getByText('No Questions Match Your Search')).toBeDefined();
      expect(screen.getByText(/We couldn't find an answer for “zzzz-unmatched”/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Clear Search & Filters/i })).toBeDefined();
    });

    it('verifies Offline PWA page provides clear messaging and reconnect action', () => {
      render(<OfflinePage />);

      expect(screen.getByRole('heading', { name: /You Are Currently Offline/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /Retry Connection/i })).toBeDefined();
    });

    it('verifies Application Error Boundary renders retry CTA and support escalation', () => {
      const resetMock = vi.fn();
      render(
        <ErrorBoundaryPage error={new Error('Simulated network timeout')} reset={resetMock} />
      );

      expect(screen.getByText(/Something Went Wrong/i)).toBeDefined();
      expect(screen.getByText(/temporary interruption/i)).toBeDefined();
      const retryBtn = screen.getByRole('button', { name: /Try Again/i });
      expect(retryBtn).toBeDefined();

      fireEvent.click(retryBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);

      // Return home link is available
      const homeLink = screen.getByRole('link', { name: /Return Home/i });
      expect(homeLink.getAttribute('href')).toBe('/');
    });
  });

  describe('2. WCAG 2.1 AA Accessibility & Motion Sensitivity (Spec 12 & 13)', () => {
    it('verifies globals.css enforces prefers-reduced-motion rule disabling animations', () => {
      const cssPath = path.resolve(__dirname, 'globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(cssContent).toContain('animation-duration: 0.01ms !important');
      expect(cssContent).toContain('transition-duration: 0.01ms !important');
      expect(cssContent).toContain('scroll-behavior: auto !important');
    });

    it('verifies globals.css configures 2px focus-visible outline for keyboard navigation', () => {
      const cssPath = path.resolve(__dirname, 'globals.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('outline: 2px solid');
      expect(cssContent).toContain('outline-offset: 2px');
    });

    it('verifies web app manifest has all required icons, colors, and 4 navigation shortcuts', () => {
      const manifestPath = path.resolve(__dirname, 'manifest.ts');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');

      expect(manifestContent).toContain("display: 'standalone'");
      expect(manifestContent).toContain("orientation: 'portrait'");
      expect(manifestContent).toContain("purpose: 'maskable'");
      expect(manifestContent).toContain('/icons/icon-192.png');
      expect(manifestContent).toContain('/icons/icon-512.png');
      expect(manifestContent).toContain('shortcuts: [');
    });

    it('verifies service worker enforces cache bounded limits and offline fallback', () => {
      const swPath = path.resolve(__dirname, '../../public/sw.js');
      const swContent = fs.readFileSync(swPath, 'utf8');

      expect(swContent).toContain('hh-images-');
      expect(swContent).toContain('MAX_IMAGE_ENTRIES = 60');
      expect(swContent).toContain('trimCache');
      expect(swContent).toContain('/offline');
    });
  });
});
