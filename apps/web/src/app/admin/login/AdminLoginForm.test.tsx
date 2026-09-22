import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AdminLoginForm from './AdminLoginForm';

describe('AdminLoginForm Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  it('renders email input, password input, sign-in button, and enterprise SSO buttons', () => {
    render(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('admin@brand.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /sign in with password/i });
    const googleBtn = screen.getByRole('button', { name: /continue with google workspace/i });
    const zohoBtn = screen.getByRole('button', { name: /continue with zoho mail/i });

    expect(emailInput).toBeInTheDocument();
    expect(emailInput.value).toBe('');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.value).toBe('');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
    expect(googleBtn).toBeInTheDocument();
    expect(zohoBtn).toBeInTheDocument();
  });

  it('renders initial error alert when provided via prop', () => {
    render(<AdminLoginForm initialError="Access denied: unauthorized domain." />);
    expect(screen.getByText('Access denied: unauthorized domain.')).toBeInTheDocument();
  });

  it('updates form fields on user input', () => {
    render(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('admin@brand.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'ops@brand.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass!2026' } });

    expect(emailInput.value).toBe('ops@brand.com');
    expect(passwordInput.value).toBe('SecurePass!2026');
  });

  it('handles successful authentication and redirects to /admin/orders', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    render(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('admin@brand.com');
    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in with password/i });

    fireEvent.change(emailInput, { target: { value: 'admin@brand.com' } });
    fireEvent.change(passwordInput, { target: { value: 'valid_password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@brand.com', password: 'valid_password' })
      });
      expect(window.location.href).toBe('/admin/orders');
    });
  });

  it('displays error alert when backend returns authentication failure or lockout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Account is temporarily locked. Try again in 900 seconds.'
      })
    });
    global.fetch = fetchMock;

    render(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('admin@brand.com');
    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in with password/i });

    fireEvent.change(emailInput, { target: { value: 'admin@brand.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong_password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Account is temporarily locked. Try again in 900 seconds.')
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /sign in with password/i })).not.toBeDisabled();
  });

  it('redirects to OAuth endpoints on SSO button click', () => {
    render(<AdminLoginForm />);

    const googleBtn = screen.getByRole('button', { name: /continue with google workspace/i });
    fireEvent.click(googleBtn);
    expect(window.location.href).toBe('/api/admin/auth/oauth/google');

    const zohoBtn = screen.getByRole('button', { name: /continue with zoho mail/i });
    fireEvent.click(zohoBtn);
    expect(window.location.href).toBe('/api/admin/auth/oauth/zoho');
  });

  it('handles unexpected network failure gracefully without crashing', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network offline'));
    global.fetch = fetchMock;

    render(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('admin@brand.com');
    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByRole('button', { name: /sign in with password/i });

    fireEvent.change(emailInput, { target: { value: 'admin@brand.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('A network error occurred. Please try again.')).toBeInTheDocument();
    });
    expect(submitBtn).not.toBeDisabled();
  });
});
