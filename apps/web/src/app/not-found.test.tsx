import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import RootNotFound from './not-found';

describe('RootNotFound Component (E-COM-147, E-COM-032)', () => {
  it('renders luxury 404 message and navigation recovery options', () => {
    render(<RootNotFound />);

    expect(screen.getByText(/Page Not Located/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();

    const catalogLink = screen.getByRole('link', { name: /catalog/i });
    expect(catalogLink).toBeInTheDocument();
    expect(catalogLink).toHaveAttribute('href', '/#catalog');

    const ordersLink = screen.getByRole('link', { name: /orders/i });
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute('href', '/account/orders');

    const storefrontLink = screen.getByRole('link', { name: /return to storefront/i });
    expect(storefrontLink).toBeInTheDocument();
    expect(storefrontLink).toHaveAttribute('href', '/');

    const conciergeLink = screen.getByRole('link', { name: /concierge desk/i });
    expect(conciergeLink).toBeInTheDocument();
    expect(conciergeLink).toHaveAttribute('href', '/contact');
  });
});
