import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { User } from '@hh/domain';

import { AccountNav } from './AccountNav';

const mockLogout = vi.fn();
let mockCurrentUser: User | null = null;

vi.mock('next/navigation', () => ({
  usePathname: () => '/account'
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    logout: mockLogout
  })
}));

describe('AccountNav Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCurrentUser = {
      id: 'usr-1',
      storeId: 'store-1',
      phone: '+919876543210',
      name: 'Zahra Khan',
      phoneVerified: true,
      role: 'customer',
      whatsappOptIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  it('renders patron name, phone, and standard navigation links', () => {
    render(<AccountNav />);

    expect(screen.getByText('Zahra Khan')).toBeInTheDocument();
    expect(screen.getByText('+919876543210')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /my profile/i })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: /order history/i })).toHaveAttribute('href', '/account/orders');
    expect(screen.getByRole('link', { name: /saved addresses/i })).toHaveAttribute('href', '/account/addresses');
    expect(screen.getByRole('link', { name: /family & sizes/i })).toHaveAttribute('href', '/account/family');
    expect(screen.getByRole('link', { name: /saved wishlist/i })).toHaveAttribute('href', '/account/wishlist');
  });

  it('renders staff portal link when role is admin or super_admin', () => {
    mockCurrentUser = {
      ...mockCurrentUser!,
      role: 'super_admin'
    };

    render(<AccountNav />);

    const staffLink = screen.getByRole('link', { name: /admin portal/i });
    expect(staffLink).toBeInTheDocument();
    expect(staffLink).toHaveAttribute('href', '/admin');
  });

  it('calls logout when Sign Out button is clicked', () => {
    render(<AccountNav />);

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
