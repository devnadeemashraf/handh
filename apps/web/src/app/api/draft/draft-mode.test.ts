import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as disableHandler } from './disable/route';
import { GET as previewHandler } from './preview/route';

const mockEnable = vi.fn();
const mockDisable = vi.fn();
const mockRedirect = vi.fn();
const mockGetAdminSession = vi.fn();

vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => ({
    enable: mockEnable,
    disable: mockDisable
  }))
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url)
}));

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: () => mockGetAdminSession()
}));

describe('Draft Mode API Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['PREVIEW_SECRET'] = 'test_preview_secret';
  });

  describe('GET /api/draft/preview', () => {
    it('returns 401 when no secret is provided and caller is not an authenticated admin', async () => {
      mockGetAdminSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/draft/preview');
      const response = await previewHandler(request);

      expect(response.status).toBe(401);
      expect(mockEnable).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('returns 401 when invalid secret is provided and caller is not an authenticated admin', async () => {
      mockGetAdminSession.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/draft/preview?secret=wrong_secret');
      const response = await previewHandler(request);

      expect(response.status).toBe(401);
      expect(mockEnable).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('enables draft mode and redirects to default root / when secret matches', async () => {
      mockGetAdminSession.mockResolvedValue(null);

      const request = new Request(
        'http://localhost:3000/api/draft/preview?secret=test_preview_secret'
      );
      await previewHandler(request);

      expect(mockEnable).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('enables draft mode and redirects to requested relative path', async () => {
      mockGetAdminSession.mockResolvedValue(null);

      const request = new Request(
        'http://localhost:3000/api/draft/preview?secret=test_preview_secret&path=/products/royal-gold-pin'
      );
      await previewHandler(request);

      expect(mockEnable).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/products/royal-gold-pin');
    });

    it('authenticates via active admin session without needing a query secret', async () => {
      mockGetAdminSession.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@handh.in',
        role: 'owner'
      });

      const request = new Request('http://localhost:3000/api/draft/preview?path=/categories/rings');
      await previewHandler(request);

      expect(mockEnable).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/categories/rings');
    });

    it('sanitizes open redirect attempts to root /', async () => {
      mockGetAdminSession.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@handh.in',
        role: 'owner'
      });

      // Protocol-relative URL attempt
      const request1 = new Request(
        'http://localhost:3000/api/draft/preview?path=//evil.com/phishing'
      );
      await previewHandler(request1);
      expect(mockRedirect).toHaveBeenCalledWith('/');

      // Backslash attempt
      const request2 = new Request('http://localhost:3000/api/draft/preview?path=/\\evil.com');
      await previewHandler(request2);
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });
  });

  describe('GET /api/draft/disable', () => {
    it('disables draft mode and redirects to root / by default', async () => {
      const request = new Request('http://localhost:3000/api/draft/disable');
      await disableHandler(request);

      expect(mockDisable).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('disables draft mode and redirects to requested relative path', async () => {
      const request = new Request(
        'http://localhost:3000/api/draft/disable?path=/products/silver-stud'
      );
      await disableHandler(request);

      expect(mockDisable).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/products/silver-stud');
    });

    it('sanitizes open redirect attempts upon disabling draft mode', async () => {
      const request = new Request('http://localhost:3000/api/draft/disable?path=//malicious.com');
      await disableHandler(request);

      expect(mockDisable).toHaveBeenCalledTimes(1);
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });
  });
});
