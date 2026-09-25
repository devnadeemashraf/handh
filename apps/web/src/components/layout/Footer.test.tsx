import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import { Footer } from './Footer';

describe('Footer Component', () => {
  it('renders store name and copyright statement', () => {
    render(<Footer storeName="H&H Flagship" />);

    expect(screen.getByText('H&H Flagship')).toBeDefined();
    expect(screen.getByText(/All rights reserved/i)).toBeDefined();
  });

  it('renders statutory corporate entity coordinates and CIN/GSTIN under Rule 5(3)(f)', () => {
    render(<Footer storeName="H&H" />);

    expect(
      screen.getByText(
        new RegExp(`Registered Corporate Entity: ${DEFAULT_BRAND_IDENTITY.legalName}`, 'i')
      )
    ).toBeDefined();
    expect(screen.getByText(/Registered Office: Plot No\. 128/i)).toBeDefined();
    expect(screen.getByText(/CIN:/i)).toBeDefined();
    expect(screen.getByText(/GSTIN:/i)).toBeDefined();
  });

  it('renders statutory Grievance Officer disclosure and links to /grievance', () => {
    render(<Footer storeName="H&H" />);

    // Grievance Officer name and SLA link
    expect(screen.getByText(/Consumer Grievance Desk \(48h SLA\)/i)).toBeDefined();
    expect(screen.getByText(DEFAULT_BRAND_IDENTITY.grievanceOfficer.name)).toBeDefined();
    expect(screen.getByText(DEFAULT_BRAND_IDENTITY.grievanceOfficer.email)).toBeDefined();

    // Verify /grievance links exist
    const grievanceLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/grievance');
    expect(grievanceLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders all statutory policy and customer service links', () => {
    render(<Footer storeName="H&H" />);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/track');
    expect(hrefs).toContain('/grievance');
    expect(hrefs).toContain('/terms');
    expect(hrefs).toContain('/privacy');
    expect(hrefs).toContain('/refunds');
    expect(hrefs).toContain('/shipping-policy');
    expect(hrefs).toContain('/contact');
  });

  it('renders Instagram link when handle provided, and omits when undefined', () => {
    const { rerender } = render(<Footer storeName="H&H" instagramHandle="handh_official" />);
    expect(screen.getByText(/Follow @handh_official on Instagram/i)).toBeDefined();

    rerender(<Footer storeName="H&H" instagramHandle={undefined} />);
    expect(screen.queryByText(/on Instagram/i)).toBeNull();
  });
});
