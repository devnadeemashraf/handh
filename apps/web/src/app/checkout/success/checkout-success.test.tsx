import { notFound } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import * as dbModule from '@hh/db';

import type { Order, OrderItem } from '@hh/db';
import type { User } from '@hh/domain';

import * as adminAuthModule from '../../../lib/admin-auth';
import * as authModule from '../../../lib/auth';
import { generateOrderReceiptToken } from '../../../lib/receipt-token';
import CheckoutSuccessPage from './page';

import type { AdminSessionContext } from '../../../lib/admin-auth';

vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
}));

vi.mock('../../../lib/auth', () => ({
  getCurrentUser: vi.fn()
}));

vi.mock('../../../lib/admin-auth', () => ({
  getAdminSession: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findOrderByOrderNumber: vi.fn()
}));

describe('CheckoutSuccessPage IDOR & PII Authorization (E-COM-143)', () => {
  const orderId = '11111111-2222-3333-4444-555555555555';
  const orderNumber = 'HH-2026-00042';
  const ownerUserId = 'user-owner-123';

  const mockOrder = {
    id: orderId,
    orderNumber,
    userId: ownerUserId,
    status: 'paid',
    paymentStatus: 'captured',
    totalMinor: 49900,
    subtotalMinor: 49900,
    shippingMinor: 0,
    discountMinor: 0,
    currency: 'INR',
    customerName: 'Zainab Ahmed',
    customerEmail: 'zainab@example.com',
    customerPhone: '+919876543210',
    shippingAddress: {
      line1: 'House 12, Rose Lane',
      line2: 'Apartment 4B',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'IN'
    },
    items: [
      {
        id: 'item-1',
        orderId,
        variantId: 'var-1',
        productNameSnapshot: 'Artisan Silver Ring',
        variantNameSnapshot: '925 Silver',
        skuSnapshot: 'SKU-SILVER-01',
        unitPriceMinor: 49900,
        totalPriceMinor: 49900,
        quantity: 1
      }
    ]
  } as unknown as Order & { items: OrderItem[] };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notFound).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    vi.mocked(dbModule.findOrderByOrderNumber).mockResolvedValue(mockOrder);
  });

  it('triggers notFound when orderNumber is missing', async () => {
    await expect(CheckoutSuccessPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );

    expect(notFound).toHaveBeenCalled();
  });

  it('triggers notFound when order does not exist in database', async () => {
    vi.mocked(dbModule.findOrderByOrderNumber).mockResolvedValueOnce(null);

    await expect(
      CheckoutSuccessPage({ searchParams: Promise.resolve({ orderNumber: 'NON_EXISTENT' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('triggers notFound (404) when unauthenticated visitor attempts to view receipt without token (E-COM-143 IDOR prevention)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    await expect(
      CheckoutSuccessPage({ searchParams: Promise.resolve({ orderNumber }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('triggers notFound (404) when authenticated user visits an order belonging to another customer without token (E-COM-143)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce({
      id: 'attacker-user-999',
      role: 'customer'
    } as unknown as User);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    await expect(
      CheckoutSuccessPage({ searchParams: Promise.resolve({ orderNumber }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('renders order receipt when authenticated user is the order owner', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce({
      id: ownerUserId,
      role: 'customer'
    } as unknown as User);

    const jsx = await CheckoutSuccessPage({ searchParams: Promise.resolve({ orderNumber }) });
    render(jsx);

    expect(screen.getByText('Zainab Ahmed')).toBeInTheDocument();
    expect(screen.getByText('House 12, Rose Lane')).toBeInTheDocument();
    expect(screen.getByText('zainab@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Contact: \+91 98765 43210/)).toBeInTheDocument();
  });

  it('renders order receipt when visitor provides a valid HMAC signed receipt token (E-COM-143)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    const validToken = generateOrderReceiptToken(orderId, orderNumber);

    const jsx = await CheckoutSuccessPage({
      searchParams: Promise.resolve({ orderNumber, token: validToken })
    });
    render(jsx);

    expect(screen.getByText('Zainab Ahmed')).toBeInTheDocument();
    expect(screen.getByText('House 12, Rose Lane')).toBeInTheDocument();
  });

  it('triggers notFound when visitor provides a tampered or invalid receipt token (E-COM-143)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    await expect(
      CheckoutSuccessPage({
        searchParams: Promise.resolve({ orderNumber, token: 'invalid.tampered.token' })
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('renders order receipt when visitor is an authenticated administrator', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce({
      admin: { id: 'admin-1', role: 'super_admin' }
    } as unknown as AdminSessionContext);

    const jsx = await CheckoutSuccessPage({ searchParams: Promise.resolve({ orderNumber }) });
    render(jsx);

    expect(screen.getByText('Zainab Ahmed')).toBeInTheDocument();
  });
});
