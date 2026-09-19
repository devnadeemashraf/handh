import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { User } from '@hh/domain';

import { WishlistButton } from './WishlistButton';

const mockOpenAuthModal = vi.fn();
let mockUser: User | null = null;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    openAuthModal: mockOpenAuthModal
  })
}));

describe('WishlistButton Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUser = null;
  });

  it('prompts authentication modal when guest clicks wishlist button', () => {
    mockUser = null;

    render(<WishlistButton productId="prod-123" />);

    const btn = screen.getByRole('button', { name: /add to wishlist/i });
    fireEvent.click(btn);

    expect(mockOpenAuthModal).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: expect.stringContaining('save this exquisite')
      })
    );
  });

  it('adds product to wishlist when authenticated user clicks', async () => {
    mockUser = {
      id: 'usr-1',
      storeId: 'store-1',
      phone: '+919876543210',
      phoneVerified: true,
      emailVerified: false,
      role: 'customer',
      whatsappOptIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    const onToggle = vi.fn();
    render(<WishlistButton productId="prod-456" onToggle={onToggle} />);

    const btn = screen.getByRole('button', { name: /add to wishlist/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/user/wishlist',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ productId: 'prod-456', variantId: undefined })
        })
      );
    });

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  it('removes product from wishlist when already wishlisted', async () => {
    mockUser = {
      id: 'usr-1',
      storeId: 'store-1',
      phone: '+919876543210',
      phoneVerified: true,
      emailVerified: false,
      role: 'customer',
      whatsappOptIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    const onToggle = vi.fn();
    render(
      <WishlistButton
        productId="prod-789"
        initialWishlisted={true}
        onToggle={onToggle}
        variant="button"
      />
    );

    const btn = screen.getByRole('button', { name: /remove from wishlist/i });
    expect(screen.getByText('Saved in Wishlist')).toBeInTheDocument();

    fireEvent.click(btn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/user/wishlist/prod-789',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });
});
