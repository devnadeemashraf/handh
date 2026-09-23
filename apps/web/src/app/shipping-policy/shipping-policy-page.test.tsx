import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ShippingPolicyPage from './page';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCategoryTree: vi.fn().mockResolvedValue([])
}));

describe('Shipping Policy Page (/shipping-policy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shipping origin, courier networks, transit schedules, and pincode gate', async () => {
    const page = await ShippingPolicyPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Shipping & Delivery Policy' })
    ).toBeDefined();
    expect(screen.getByText(/Nationwide Express Courier/i)).toBeDefined();
    expect(screen.getByText(/1\. Origin & Artisanal Handling/i)).toBeDefined();
    expect(screen.getByText(/Jubilee Hills, Hyderabad, Telangana \(PIN: 500034\)/i)).toBeDefined();
    expect(screen.getByText(/2\. Courier Partners & Tracking/i)).toBeDefined();
    expect(screen.getByText(/3\. Estimated Transit Schedules/i)).toBeDefined();
    expect(screen.getByText(/4\. Postal Code Serviceability & Gate/i)).toBeDefined();
    expect(screen.getByText(/5\. Delivery Attempts & Non-Delivery Reports \(NDR\)/i)).toBeDefined();
    expect(screen.getByText(/6\. Damaged or Tampered Parcels/i)).toBeDefined();
  });
});
