import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import TermsPage from './page';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCategoryTree: vi.fn().mockResolvedValue([])
}));

describe('Terms of Sale Page (/terms)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Terms of Sale header, statutory sections, and legal links', async () => {
    const page = await TermsPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms of Sale & Platform Terms' })
    ).toBeDefined();
    expect(screen.getByText(/1\. Introduction & Contract Formation/i)).toBeDefined();
    expect(screen.getByText(/3\. Product Descriptions, Pricing & Taxes/i)).toBeDefined();
    expect(screen.getByText(/4\. Orders, Reservations & Payment/i)).toBeDefined();
    expect(screen.getByText(/5\. Shipping, Delivery & Title Transfer/i)).toBeDefined();
    expect(screen.getByText(/6\. Returns, Refunds & Cancellations/i)).toBeDefined();
    expect(screen.getByText(/7\. Grievance Redressal & Nodal Officer/i)).toBeDefined();
    expect(screen.getByText(/8\. Governing Law & Dispute Jurisdiction/i)).toBeDefined();

    // Verify links to other policies exist
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/track');
    expect(hrefs).toContain('/refunds');
    expect(hrefs).toContain('/grievance');
  });
});
