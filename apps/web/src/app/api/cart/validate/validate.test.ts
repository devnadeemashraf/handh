import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { Store } from '@hh/db';
import type { CartSummary } from '@hh/domain';

import { POST } from './route';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findStoreBySlug: vi.fn(),
  validateCartItems: vi.fn()
}));

describe('Cart Validation API Route (POST /api/cart/validate)', () => {
  const mockStore = {
    id: 'store-hh-uuid',
    slug: 'hh',
    name: 'H&H',
    defaultCurrency: 'INR'
  } as Store;

  const mockCartSummary: CartSummary = {
    items: [
      {
        variantId: '11111111-2222-3333-4444-555555555555',
        productId: 'prod-uuid-1',
        productSlug: 'vintage-filigree-nose-piece',
        productTitle: 'Vintage Filigree Nose Piece',
        variantTitle: 'Antiqued Brass',
        sku: 'HH-ACC-NP-04',
        priceMinor: 59900,
        currency: 'INR',
        availableQuantity: 10,
        requestedQuantity: 2,
        effectiveQuantity: 2,
        lineTotalMinor: 119800,
        isAvailable: true
      }
    ],
    totalQuantity: 2,
    subtotalMinor: 119800,
    currency: 'INR',
    isValidForCheckout: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid or malformed JSON payloads with 400', async () => {
    const request = new Request('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalidField: true })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid cart payload');
  });

  it('returns 404 when target store is not found in database', async () => {
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            variantId: '11111111-2222-3333-4444-555555555555',
            quantity: 1
          }
        ]
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Store not found');
  });

  it('validates cart items and returns calculated cart summary on success', async () => {
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue(mockStore);
    vi.mocked(dbModule.validateCartItems).mockResolvedValue(mockCartSummary);

    const request = new Request('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            variantId: '11111111-2222-3333-4444-555555555555',
            quantity: 2
          }
        ]
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.cart.totalQuantity).toBe(2);
    expect(body.cart.subtotalMinor).toBe(119800);
    expect(body.cart.isValidForCheckout).toBe(true);
    expect(dbModule.validateCartItems).toHaveBeenCalledWith(
      expect.anything(),
      'store-hh-uuid',
      expect.arrayContaining([
        expect.objectContaining({
          variantId: '11111111-2222-3333-4444-555555555555',
          quantity: 2
        })
      ])
    );
  });

  it('handles unexpected database or internal exceptions with 500', async () => {
    vi.mocked(dbModule.findStoreBySlug).mockRejectedValue(
      new Error('Postgres connection pool down')
    );

    const request = new Request('http://localhost:3000/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            variantId: '11111111-2222-3333-4444-555555555555',
            quantity: 1
          }
        ]
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Internal server error');
  });
});
