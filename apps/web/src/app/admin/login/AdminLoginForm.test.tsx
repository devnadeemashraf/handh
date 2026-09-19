import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginForm from './AdminLoginForm';

describe('AdminLoginForm Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  it('renders gateway key, password input, and submit button with initial key', () => {
    render(<AdminLoginForm initialKey="stealth_key_123" />);

    const keyInput = screen.getByPlaceholderText('Enter stealth access key') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /enter workshop portal/i });

    expect(keyInput).toBeInTheDocument();
    expect(keyInput.value).toBe('stealth_key_123');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.value).toBe('');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it('updates form fields on user input', () => {
    render(<AdminLoginForm initialKey="" />);

    const keyInput = screen.getByPlaceholderText('Enter stealth access key') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;

    fireEvent.change(keyInput, { target: { value: 'custom_gateway' } });
    fireEvent.change(passwordInput, { target: { value: 'artisan_pass_2026' } });

    expect(keyInput.value).toBe('custom_gateway');
    expect(passwordInput.value).toBe('artisan_pass_2026');
  });

  it('handles successful authentication and redirects to /admin/orders', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    render(<AdminLoginForm initialKey="secret_key" />);

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByRole('button', { name: /enter workshop portal/i });

    fireEvent.change(passwordInput, { target: { value: 'valid_password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'secret_key', password: 'valid_password' })
      });
      expect(window.location.href).toBe('/admin/orders');
    });
  });

  it('displays error alert when backend returns authentication failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Invalid access credentials.' })
    });
    global.fetch = fetchMock;

    render(<AdminLoginForm initialKey="wrong_key" />);

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByRole('button', { name: /enter workshop portal/i });

    fireEvent.change(passwordInput, { target: { value: 'wrong_password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid access credentials.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /enter workshop portal/i })).not.toBeDisabled();
  });

  it('handles unexpected network failure gracefully without crashing', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network offline'));
    global.fetch = fetchMock;

    render(<AdminLoginForm initialKey="key" />);

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const submitBtn = screen.getByRole('button', { name: /enter workshop portal/i });

    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('A network error occurred. Please try again.')).toBeInTheDocument();
    });
    expect(submitBtn).not.toBeDisabled();
  });
});
