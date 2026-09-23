import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LegalPageShell } from './LegalPageShell';

describe('LegalPageShell Component', () => {
  it('renders title, subtitle, badge, and effective date', () => {
    render(
      <LegalPageShell
        title="Test Policy Document"
        subtitle="This is a test subtitle explaining the policy."
        badgeText="Statutory Compliance"
        lastUpdated="September 2026"
        storeName="H&H Flagship"
      >
        <p>Main policy content goes here.</p>
      </LegalPageShell>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Test Policy Document' })).toBeDefined();
    expect(screen.getByText('This is a test subtitle explaining the policy.')).toBeDefined();
    expect(screen.getByText('Statutory Compliance')).toBeDefined();
    expect(screen.getByText(/Effective Date:/i)).toBeDefined();
    expect(screen.getByText(/Main policy content goes here/i)).toBeDefined();
  });

  it('renders corporate coordinates and links to /grievance', () => {
    render(
      <LegalPageShell
        title="Test Policy"
        subtitle="Subtitle"
        badgeText="Badge"
        lastUpdated="September 2026"
      >
        <p>Content</p>
      </LegalPageShell>
    );

    expect(screen.getByText(/Corporate Legal Coordinates/i)).toBeDefined();
    expect(
      screen.getAllByText(/H&H Luxury Modest Wear Private Limited/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Mohammed Irfan/i).length).toBeGreaterThanOrEqual(1);

    const grievanceLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/grievance');
    expect(grievanceLinks.length).toBeGreaterThanOrEqual(1);
  });
});
