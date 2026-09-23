import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import RefundsPage from './page';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCategoryTree: vi.fn().mockResolvedValue([])
}));

describe('Refunds & Returns Policy Page (/refunds)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 7-day return policy, reverse pickup flow, and Razorpay timelines', async () => {
    const page = await RefundsPage();
    render(page);

    expect(screen.getByRole('heading', { level: 1, name: 'Refund & Return Policy' })).toBeDefined();
    expect(screen.getByText(/1\. 7-Day Return Eligibility Window/i)).toBeDefined();
    expect(screen.getByText(/7-calendar-day return window/i)).toBeDefined();
    expect(screen.getByText(/2\. Hygiene & Artisanal Modest Wear Guidelines/i)).toBeDefined();
    expect(screen.getByText(/3\. Step-by-Step Return & Reverse Pickup Process/i)).toBeDefined();
    expect(screen.getByText(/Step 1: Request & Photo/i)).toBeDefined();
    expect(screen.getByText(/Step 2: Reverse Courier Pickup/i)).toBeDefined();
    expect(screen.getByText(/Step 3: Inspection & Refund/i)).toBeDefined();
    expect(screen.getByText(/4\. Refund Method & Settlement Timelines/i)).toBeDefined();
    expect(screen.getByText(/5\. Order Cancellation Before Dispatch/i)).toBeDefined();
    expect(screen.getByText(/6\. Dispute Redressal/i)).toBeDefined();
  });
});
