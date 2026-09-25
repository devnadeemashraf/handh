import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ContactForm } from './ContactForm';

describe('ContactForm Component', () => {
  it('renders all required form fields and topics', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Order Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Inquiry Topic/i)).toBeDefined();
    expect(screen.getByLabelText(/Message/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Send Inquiry/i })).toBeDefined();

    // Verify topic dropdown options
    expect(screen.getByRole('option', { name: 'Order issue' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Shipping question' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Return or exchange' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Product question' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Other' })).toBeDefined();
  });

  it('validates name, email, and message length', () => {
    render(<ContactForm />);

    const submitBtn = screen.getByRole('button', { name: /Send Inquiry/i });
    const form = submitBtn.closest('form')!;

    // 1. Missing name
    fireEvent.submit(form);
    expect(screen.getByText(/Please enter your full name/i)).toBeDefined();

    // 2. Missing/invalid email
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Amina Khan' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Please enter a valid email address/i)).toBeDefined();

    // 3. Message too short (< 10 chars)
    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'amina@example.com' } });
    const messageInput = screen.getByLabelText(/Message/i);
    fireEvent.change(messageInput, { target: { value: 'Too short' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Please provide a message with at least 10 characters/i)).toBeDefined();
  });

  it('submits successfully and renders acknowledgment message with 24h SLA', async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Zoya Rahman' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'zoya@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Order Number/i), { target: { value: 'HH-2026-9921' } });
    fireEvent.change(screen.getByLabelText(/Inquiry Topic/i), {
      target: { value: 'Shipping question' }
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'Hello, could you confirm when my package will arrive in Bangalore?' }
    });

    const submitBtn = screen.getByRole('button', { name: /Send Inquiry/i });
    fireEvent.submit(submitBtn.closest('form')!);

    const successHeading = await screen.findByText(/Message Received With Gratitude/i);
    expect(successHeading).toBeDefined();
    expect(screen.getByText(/within 24 hours/i)).toBeDefined();
    expect(screen.getByText(/Zoya Rahman/i)).toBeDefined();
  });
});
