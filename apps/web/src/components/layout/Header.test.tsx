import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Header } from './Header';

let mockPathname = '/';
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    back: mockBack
  })
}));

const mockOpenSearch = vi.fn();
vi.mock('@/context/SearchContext', () => ({
  useSearch: () => ({
    openSearch: mockOpenSearch
  })
}));

vi.mock('./HeaderUserButton', () => ({
  HeaderUserButton: () => <div data-testid="header-user-button">UserButton</div>
}));

vi.mock('./HeaderCartButton', () => ({
  HeaderCartButton: () => <div data-testid="header-cart-button">CartButton</div>
}));

describe('Header Component (Sprint 11.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('renders store logotype, desktop nav links, and utility buttons', () => {
    render(
      <Header
        storeName="The Haya Collection"
        categories={[
          {
            id: 'cat-1',
            name: 'Abayas',
            slug: 'abayas',
            description: null,
            subcategories: []
          }
        ]}
      />
    );

    expect(screen.getByText('The Haya Collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByTestId('header-cart-button')).toBeInTheDocument();
  });

  it('triggers openSearch when the desktop search button is clicked', () => {
    render(<Header />);

    const searchButton = screen.getByRole('button', { name: /search catalog/i });
    fireEvent.click(searchButton);
    expect(mockOpenSearch).toHaveBeenCalled();
  });

  it('toggles border-on-scroll when scrolling past 32px', () => {
    const { container } = render(<Header />);
    const headerEl = container.querySelector('header');
    expect(headerEl).toHaveClass('border-transparent');

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    expect(headerEl).toHaveClass('border-border-subtle');
  });

  it('renders back button on mobile when navigating a non-root page', () => {
    mockPathname = '/products/emerald-abaya';
    render(<Header />);

    const backButton = screen.getByRole('button', { name: /go back/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();
  });

  it('does NOT render back button when on root page', () => {
    mockPathname = '/';
    render(<Header />);

    expect(screen.queryByRole('button', { name: /go back/i })).toBeNull();
  });
});
