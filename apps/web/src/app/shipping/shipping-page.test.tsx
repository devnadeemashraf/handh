import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ShippingPage, { metadata } from './page';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H Luxury Modest Wear',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCachedCategories: vi.fn().mockResolvedValue([])
}));

describe('Shipping & Delivery Guide (/shipping)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports canonical metadata for shipping guide', () => {
    expect(metadata.title).toContain('Shipping & Delivery Guide');
    expect(metadata.description).toContain('Domestic delivery timelines');
  });

  it('renders rate table, jump-nav, transit sections, and tracking link', async () => {
    const page = await ShippingPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Shipping & Delivery Guide' })
    ).toBeDefined();

    // Table content
    expect(screen.getByText('Hyderabad & Telangana (Local)')).toBeDefined();
    expect(screen.getByText('Metros (Delhi, Mumbai, Bengaluru, Chennai, Kolkata)')).toBeDefined();
    expect(screen.getAllByText('Complimentary').length).toBeGreaterThanOrEqual(1);

    // Topic sections
    expect(screen.getByText(/1\. Shipping Process/i)).toBeDefined();
    expect(screen.getByText(/2\. Delivery Timelines & Rates/i)).toBeDefined();
    expect(screen.getByText(/3\. Delivery Locations/i)).toBeDefined();
    expect(screen.getByText(/4\. Real-Time Consignment Tracking/i)).toBeDefined();
    expect(screen.getByText(/5\. Transparent Shipping Charges/i)).toBeDefined();

    // Direct tracking CTA
    const trackLinks = screen.getAllByRole('link', { name: /Track Shipment|Track an Order/i });
    expect(trackLinks.length).toBeGreaterThanOrEqual(1);
    expect(trackLinks[0]?.getAttribute('href')).toBe('/track');
  });
});
