import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SizeGuideModal } from './SizeGuideModal';

describe('SizeGuideModal Component', () => {
  it('renders modal with size guide table when open', () => {
    const onClose = vi.fn();
    render(<SizeGuideModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Size Guide' })).toBeInTheDocument();
    expect(screen.getByText('Metric (cm)')).toBeInTheDocument();
    expect(screen.getByText('Imperial (in)')).toBeInTheDocument();

    // Default is metric (cm)
    expect(screen.getAllByText('84 cm').length).toBeGreaterThanOrEqual(1);

    // Toggle to imperial
    const imperialBtn = screen.getByRole('button', { name: 'Imperial (in)' });
    fireEvent.click(imperialBtn);

    expect(screen.getAllByText('33″').length).toBeGreaterThanOrEqual(1);
  });

  it('renders nothing when closed', () => {
    const onClose = vi.fn();
    render(<SizeGuideModal isOpen={false} onClose={onClose} />);

    expect(screen.queryByText('Size Guide')).not.toBeInTheDocument();
  });
});
