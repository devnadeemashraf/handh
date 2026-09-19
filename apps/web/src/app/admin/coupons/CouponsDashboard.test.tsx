import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CouponsDashboard from './CouponsDashboard';
import type { Coupon } from '@hh/domain';

const mockCoupons: Coupon[] = [
  {
    id: 'c1',
    code: 'WELCOME10',
    discountType: 'percentage',
    value: 10,
    minOrderValueMinor: 50000,
    maxDiscountMinor: 20000,
    usageLimit: 100,
    timesUsed: 15,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'c2',
    code: 'FESTIVAL500',
    discountType: 'fixed',
    value: 50000,
    minOrderValueMinor: 200000,
    maxDiscountMinor: null,
    usageLimit: null,
    timesUsed: 4,
    startsAt: null,
    expiresAt: '2026-12-31T23:59:59Z',
    isActive: false,
    createdAt: '2026-09-05T00:00:00Z'
  }
];

describe('CouponsDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      }
    });
  });

  it('renders promotional coupons list and summary scorecards', () => {
    render(<CouponsDashboard initialCoupons={mockCoupons} />);

    expect(screen.getByText('Promotional Coupons & Discounts')).toBeInTheDocument();
    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('FESTIVAL500')).toBeInTheDocument();

    // Redemptions count: 15 + 4 = 19
    expect(screen.getByText('19')).toBeInTheDocument();
  });

  it('filters coupons when switching between tabs', () => {
    render(<CouponsDashboard initialCoupons={mockCoupons} />);

    // Click Active tab
    const activeTab = screen.getByRole('button', { name: /^active$/i });
    fireEvent.click(activeTab);

    expect(screen.getByText('WELCOME10')).toBeInTheDocument();
    expect(screen.queryByText('FESTIVAL500')).not.toBeInTheDocument();

    // Click Inactive tab
    const inactiveTab = screen.getByRole('button', { name: /^inactive$/i });
    fireEvent.click(inactiveTab);

    expect(screen.queryByText('WELCOME10')).not.toBeInTheDocument();
    expect(screen.getByText('FESTIVAL500')).toBeInTheDocument();
  });

  it('filters coupons by search term', () => {
    render(<CouponsDashboard initialCoupons={mockCoupons} />);

    const searchInput = screen.getByPlaceholderText('Search coupon code...');
    fireEvent.change(searchInput, { target: { value: 'fest' } });

    expect(screen.queryByText('WELCOME10')).not.toBeInTheDocument();
    expect(screen.getByText('FESTIVAL500')).toBeInTheDocument();
  });

  it('toggles coupon active status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        coupon: { ...mockCoupons[0], isActive: false }
      })
    });
    global.fetch = fetchMock;

    render(<CouponsDashboard initialCoupons={mockCoupons} />);

    const pauseBtn = screen.getByRole('button', { name: /pause coupon welcome10/i });
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/coupons/c1',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false })
        })
      );
      expect(screen.getByText(/coupon 'welcome10' deactivated/i)).toBeInTheDocument();
    });
  });

  it('opens create modal, submits new coupon, and adds it to the roster', async () => {
    const newCoupon: Coupon = {
      id: 'c3',
      code: 'SUMMER20',
      discountType: 'percentage',
      value: 20,
      minOrderValueMinor: 100000,
      maxDiscountMinor: null,
      usageLimit: 50,
      timesUsed: 0,
      startsAt: null,
      expiresAt: null,
      isActive: true,
      createdAt: '2026-09-19T00:00:00Z'
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        coupon: newCoupon
      })
    });
    global.fetch = fetchMock;

    render(<CouponsDashboard initialCoupons={mockCoupons} />);

    const createBtn = screen.getByRole('button', { name: /create new coupon/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Create Promotional Coupon')).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/coupon code/i);
    fireEvent.change(codeInput, { target: { value: 'summer20' } });

    const submitBtn = screen.getByRole('button', { name: /publish coupon/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/coupons',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"code":"SUMMER20"')
        })
      );
      expect(screen.getByText('SUMMER20')).toBeInTheDocument();
    });
  });

  it('copies coupon code to clipboard on copy click', () => {
    render(<CouponsDashboard initialCoupons={mockCoupons} />);

    const copyBtn = screen.getByRole('button', { name: /copy coupon welcome10/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('WELCOME10');
  });
});
