import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import PrivacyPage from './page';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCategoryTree: vi.fn().mockResolvedValue([])
}));

describe('Privacy Policy Page (/privacy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DPDP Act compliance sections, data rights, and grievance officer email', async () => {
    const page = await PrivacyPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy & Data Protection' })
    ).toBeDefined();
    expect(screen.getByText(/DPDP Act, 2023 Compliant/i)).toBeDefined();
    expect(screen.getByText(/1\. Identity of Data Fiduciary/i)).toBeDefined();
    expect(screen.getByText(/2\. Personal Data We Collect/i)).toBeDefined();
    expect(screen.getByText(/3\. Purpose of Processing & Legal Basis/i)).toBeDefined();
    expect(screen.getByText(/4\. Data Sharing & Third-Party Processors/i)).toBeDefined();
    expect(screen.getByText(/5\. Statutory Data Retention & Erasure/i)).toBeDefined();
    expect(screen.getByText(/6\. Your Rights Under DPDP Act, 2023/i)).toBeDefined();

    // Verify grievance link and email
    const grievanceLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href') === '/grievance');
    expect(grievanceLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('grievance@handh.in').length).toBeGreaterThanOrEqual(1);
  });
});
