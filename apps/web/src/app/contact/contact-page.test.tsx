import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ContactPage from './page';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCategoryTree: vi.fn().mockResolvedValue([])
}));

describe('Contact Us Page (/contact)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders support concierge, studio coordinates, helpline, and grievance desk links', async () => {
    const page = await ContactPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Contact Us & Concierge Desk' })
    ).toBeDefined();
    expect(screen.getByText(/Customer Concierge/i)).toBeDefined();
    expect(screen.getAllByText('support@handh.in').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Workshop Studio/i)).toBeDefined();
    expect(screen.getAllByText(/Registered Corporate Entity/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Consumer Grievance Redressal/i)).toBeDefined();
    expect(screen.getAllByText(/Mohammed Irfan/i).length).toBeGreaterThanOrEqual(1);

    // Verify /grievance and /track links exist
    const grievanceLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href') === '/grievance');
    expect(grievanceLinks.length).toBeGreaterThanOrEqual(1);

    const trackLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href') === '/track');
    expect(trackLinks.length).toBeGreaterThanOrEqual(1);
  });
});
