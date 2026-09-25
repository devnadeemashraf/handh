import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { UserAddress } from '@hh/domain';

import AccountAddressesPage from './page';

const mockAddToast = vi.fn();

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    toast: mockAddToast,
    removeToast: vi.fn(),
    toasts: []
  })
}));

const mockAddress: UserAddress = {
  id: 'addr-101',
  userId: 'user-1',
  label: 'Home',
  recipientName: 'Fatima Al-Mansoor',
  phone: '+919876543210',
  line1: 'Villa 12, Jubilee Hills',
  line2: 'Road No 36',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500033',
  country: 'India',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('AccountAddressesPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state when user has no addresses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, addresses: [] })
    });

    render(<AccountAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('No Saved Addresses')).toBeInTheDocument();
      expect(
        screen.getByText('Save your home or work destination for seamless doorstep delivery.')
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /add first address/i })).toBeInTheDocument();
  });

  it('renders saved addresses with default badge and contact info', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, addresses: [mockAddress] })
    });

    render(<AccountAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('Fatima Al-Mansoor')).toBeInTheDocument();
      expect(screen.getByText('Villa 12, Jubilee Hills')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('opens add modal, submits new address, and displays success toast', async () => {
    global.fetch = vi.fn().mockImplementation((_url: string, opts?: { method?: string }) => {
      if (opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, address: mockAddress })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, addresses: [] })
      });
    });

    render(<AccountAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('No Saved Addresses')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /add first address/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('New Delivery Address')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Full recipient name');
    fireEvent.change(nameInput, { target: { value: 'Fatima Al-Mansoor' } });

    const phoneInput = screen.getByPlaceholderText('+919876543210');
    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });

    const line1Input = screen.getByPlaceholderText('Flat / Villa / Street');
    fireEvent.change(line1Input, { target: { value: 'Villa 12, Jubilee Hills' } });

    const cityInput = screen.getByPlaceholderText('Hyderabad');
    fireEvent.change(cityInput, { target: { value: 'Hyderabad' } });

    const pinInput = screen.getByPlaceholderText('500034');
    fireEvent.change(pinInput, { target: { value: '500033' } });

    const saveBtn = screen.getByRole('button', { name: /save address/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Address saved'
        })
      );
    });
  });
});
