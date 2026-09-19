import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminHeader from './AdminHeader';

describe('AdminHeader Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  it('renders branding, workshop identity, and protected portal badge', () => {
    render(<AdminHeader />);

    expect(screen.getByText('H&H')).toBeInTheDocument();
    expect(screen.getByText('Workshop Operations')).toBeInTheDocument();
    expect(screen.getByText('Protected Portal')).toBeInTheDocument();
  });

  it('renders navigation links to orders, inventory, and live storefront', () => {
    render(<AdminHeader />);

    const ordersLink = screen.getByRole('link', { name: /orders/i });
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute('href', '/admin/orders');

    const inventoryLink = screen.getByRole('link', { name: /inventory/i });
    expect(inventoryLink).toBeInTheDocument();
    expect(inventoryLink).toHaveAttribute('href', '/admin/inventory');

    const insightsLink = screen.getByRole('link', { name: /insights/i });
    expect(insightsLink).toBeInTheDocument();
    expect(insightsLink).toHaveAttribute('href', '/admin/insights');

    const couponsLink = screen.getByRole('link', { name: /coupons/i });
    expect(couponsLink).toBeInTheDocument();
    expect(couponsLink).toHaveAttribute('href', '/admin/coupons');

    const brandLink = screen.getByRole('link', { name: /brand/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/admin/brand');

    const servicesLink = screen.getByRole('link', { name: /services/i });
    expect(servicesLink).toBeInTheDocument();
    expect(servicesLink).toHaveAttribute('href', '/admin/service-control');

    const liveStoreLink = screen.getByRole('link', { name: /live store/i });
    expect(liveStoreLink).toBeInTheDocument();
    expect(liveStoreLink).toHaveAttribute('href', '/');
    expect(liveStoreLink).toHaveAttribute('target', '_blank');
  });

  it('handles sign out action by calling logout API and redirecting to root', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    render(<AdminHeader />);

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    expect(signOutBtn).toBeInTheDocument();

    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/logout', { method: 'POST' });
      expect(window.location.href).toBe('/');
    });
  });

  it('redirects to root even if logout API returns a network error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = fetchMock;

    render(<AdminHeader />);

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });
});
