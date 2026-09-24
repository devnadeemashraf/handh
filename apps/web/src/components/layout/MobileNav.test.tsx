import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { MobileNav } from './MobileNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/')
}));

// Mock contexts
const mockOpenAuthModal = vi.fn();
const mockOpenCart = vi.fn();
let mockUser: { id: string; email: string } | null = null;
let mockTotalItemCount = 0;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    openAuthModal: mockOpenAuthModal
  })
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    totalItemCount: mockTotalItemCount,
    openCart: mockOpenCart
  })
}));

describe('MobileNav Component (E-COM-145)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockTotalItemCount = 0;
  });

  it('renders all 5 navigation links and unauthenticated Sign In button without nested links', () => {
    render(<MobileNav />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
    expect(screen.getByText('Bag')).toBeInTheDocument();

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();

    // Verify no <a> tags exist inside any <button> element (E-COM-145 DOM nesting validation)
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.querySelector('a')).toBeNull();
    });

    fireEvent.click(signInButton);
    expect(mockOpenAuthModal).toHaveBeenCalledWith({
      reason: 'Sign in to access your orders and profile.'
    });
  });

  it('renders direct Account Link when authenticated without wrapping button (E-COM-145)', () => {
    mockUser = { id: 'usr_123', email: 'patron@example.com' };
    render(<MobileNav />);

    const accountLink = screen.getByRole('link', { name: /account/i });
    expect(accountLink).toBeInTheDocument();
    expect(accountLink).toHaveAttribute('href', '/account');

    // Confirm the link is not nested inside any button
    expect(accountLink.closest('button')).toBeNull();
  });

  it('triggers openCart when Bag button is clicked', () => {
    mockTotalItemCount = 3;
    render(<MobileNav />);

    const bagButton = screen.getByRole('button', { name: /open shopping bag with 3 items/i });
    expect(bagButton).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(bagButton);
    expect(mockOpenCart).toHaveBeenCalled();
  });
});
