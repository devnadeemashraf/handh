import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { MobileBottomNav } from './MobileBottomNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/')
}));

// Mock contexts
const mockOpenAuthModal = vi.fn();
const mockOpenSearch = vi.fn();
let mockUser: { id: string; email: string } | null = null;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    openAuthModal: mockOpenAuthModal
  })
}));

vi.mock('@/context/SearchContext', () => ({
  useSearch: () => ({
    isOpen: false,
    openSearch: mockOpenSearch
  })
}));

describe('MobileBottomNav Component (Sprint 11.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  it('renders all 5 intent-driven navigation items (Home, Shop, Search, Wishlist, Sign In/Account)', () => {
    render(<MobileBottomNav />);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /wishlist/i })).toBeInTheDocument();

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();

    // Verify no <a> tags exist inside any <button> element
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.querySelector('a')).toBeNull();
    });

    fireEvent.click(signInButton);
    expect(mockOpenAuthModal).toHaveBeenCalledWith({
      reason: 'Sign in to access your orders and profile.'
    });
  });

  it('triggers openSearch when Search button is tapped', () => {
    render(<MobileBottomNav />);

    const searchButton = screen.getByRole('button', { name: /search catalog/i });
    fireEvent.click(searchButton);
    expect(mockOpenSearch).toHaveBeenCalled();
  });

  it('renders direct Account Link when authenticated without wrapping button', () => {
    mockUser = { id: 'usr_123', email: 'patron@example.com' };
    render(<MobileBottomNav />);

    const accountLink = screen.getByRole('link', { name: /account/i });
    expect(accountLink).toBeInTheDocument();
    expect(accountLink).toHaveAttribute('href', '/account');

    // Confirm the link is not nested inside any button
    expect(accountLink.closest('button')).toBeNull();
  });

  it('does NOT contain a Bag/Cart button (Cart lives in the top bar per design spec)', () => {
    render(<MobileBottomNav />);
    expect(screen.queryByText('Bag')).toBeNull();
    expect(screen.queryByText('Cart')).toBeNull();
  });
});
