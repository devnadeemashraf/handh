import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AccountProfilePage from './page';

const mockRefreshUser = vi.fn().mockResolvedValue(undefined);
const mockAddToast = vi.fn();

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    toast: mockAddToast,
    removeToast: vi.fn(),
    toasts: []
  })
}));

const mockUser = {
  id: 'usr-1',
  name: 'Fatima Al-Zahra',
  email: 'fatima@example.com',
  phone: '+919876543210',
  whatsappOptIn: true,
  role: 'customer'
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUser: mockRefreshUser,
    isLoading: false,
    logout: vi.fn()
  })
}));

describe('AccountProfilePage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders verified mobile number and existing profile details', () => {
    render(<AccountProfilePage />);

    expect(screen.getByText('My Profile & Preferences')).toBeInTheDocument();
    expect(screen.getByText('+919876543210')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fatima Al-Zahra')).toBeInTheDocument();
    expect(screen.getByDisplayValue('fatima@example.com')).toBeInTheDocument();
  });

  it('saves profile modifications and triggers toast confirmation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<AccountProfilePage />);

    const nameInput = screen.getByDisplayValue('Fatima Al-Zahra');
    fireEvent.change(nameInput, { target: { value: 'Fatima Begum' } });

    const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Fatima Begum',
            email: 'fatima@example.com',
            whatsappOptIn: true
          })
        })
      );
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Profile updated'
        })
      );
    });
  });

  it('renders notification preferences including locked order updates', () => {
    render(<AccountProfilePage />);

    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Order & Delivery Updates')).toBeInTheDocument();
    expect(screen.getByText('Always Active')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp Concierge Updates')).toBeInTheDocument();
    expect(screen.getByText('Promotions & Seasonal Drops')).toBeInTheDocument();
    expect(screen.getByText('Restock & Back-in-Stock Alerts')).toBeInTheDocument();
  });
});
