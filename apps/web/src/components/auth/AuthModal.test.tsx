import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getBrandSecureAccessTitle } from '@hh/domain';

import { AuthModal } from './AuthModal';

describe('AuthModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders phone entry step with branding and custom reason when open', () => {
    render(
      <AuthModal
        isOpen={true}
        onClose={vi.fn()}
        reason="An account is required to place your order."
      />
    );

    expect(screen.getByText(getBrandSecureAccessTitle())).toBeInTheDocument();
    expect(screen.getByText('An account is required to place your order.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('98765 43210')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
  });

  it('calls onClose when close icon is clicked', () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText(/close authentication modal/i);
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('requests OTP and moves to verification step on valid phone submission', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'OTP sent', devCode: '123456' })
    });
    global.fetch = fetchMock;

    render(<AuthModal isOpen={true} onClose={vi.fn()} initialPhone="9876543210" />);

    const submitBtn = screen.getByRole('button', { name: /send verification code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/otp/request',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ phone: '+919876543210', purpose: 'login' })
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Verify Mobile Number')).toBeInTheDocument();
    });
  });

  it('allows entering OTP and verifies successfully calling onSuccess', async () => {
    const mockUser = {
      id: 'user-123',
      storeId: 'store-1',
      phone: '+919876543210',
      phoneVerified: true,
      role: 'customer',
      whatsappOptIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const fetchMock = vi
      .fn()
      // First call: request OTP
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'OTP sent', devCode: '654321' })
      })
      // Second call: verify OTP
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user: mockUser })
      });
    global.fetch = fetchMock;

    const onSuccess = vi.fn();
    render(
      <AuthModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} initialPhone="9876543210" />
    );

    // Step 1: Request OTP
    fireEvent.click(screen.getByRole('button', { name: /send verification code/i }));

    await waitFor(() => {
      expect(screen.getByText('Verify Mobile Number')).toBeInTheDocument();
    });

    // Step 2: Fill OTP and submit
    const otpInput = screen.getByPlaceholderText('• • • • • •');
    fireEvent.change(otpInput, { target: { value: '654321' } });

    const verifyBtn = screen.getByRole('button', { name: /verify & continue/i });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
  });
});
