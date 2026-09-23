import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { GrievanceForm } from './GrievanceForm';

describe('GrievanceForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      }
    });
  });

  it('renders all statutory complaint input fields and category options', () => {
    render(<GrievanceForm />);

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Order Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Grievance Category/i)).toBeDefined();
    expect(screen.getByLabelText(/Subject Summary/i)).toBeDefined();
    expect(screen.getByLabelText(/Detailed Statement of Grievance/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Submit Grievance for Redressal/i })).toBeDefined();
  });

  it('displays client-side validation errors when required fields are empty', async () => {
    render(<GrievanceForm />);

    const submitBtn = screen.getByRole('button', { name: /Submit Grievance for Redressal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Full name must be at least 2 characters/i)).toBeDefined();
      expect(screen.getByText(/Please provide a valid email address/i)).toBeDefined();
      expect(
        screen.getByText(/Please describe your grievance in at least 10 characters/i)
      ).toBeDefined();
    });
  });

  it('extracts and formats phone digits when typed or pasted', () => {
    render(<GrievanceForm />);

    const phoneInput = screen.getByLabelText(/Mobile Number/i) as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '+91 98765 43210' } });

    expect(phoneInput.value).toBe('9876543210');
  });

  it('submits valid grievance, renders official ticket reference and SLA details', async () => {
    const mockTicketResult = {
      success: true,
      ticketReference: 'GRV-20260923-KLM890',
      status: 'received',
      acknowledgementDueAt: '2026-09-25T12:00:00.000Z',
      resolutionDueAt: '2026-10-23T12:00:00.000Z',
      createdAt: '2026-09-23T12:00:00.000Z',
      message:
        'Your grievance has been officially registered under Consumer Protection (E-Commerce) Rules, 2020.'
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTicketResult
    } as unknown as Response);

    render(<GrievanceForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Zehra Naqvi' }
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'zehra@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), {
      target: { value: '9876543210' }
    });
    fireEvent.change(screen.getByLabelText(/Order Number/i), {
      target: { value: 'HH-2026-0199' }
    });
    fireEvent.change(screen.getByLabelText(/Detailed Statement of Grievance/i), {
      target: { value: 'The shipment has been held in dispatch hub for over 5 days.' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Grievance for Redressal/i }));

    await waitFor(() => {
      expect(screen.getByText(/Grievance Lodged Successfully/i)).toBeDefined();
      expect(screen.getByText('GRV-20260923-KLM890')).toBeDefined();
      expect(screen.getByText(/48-Hour Acknowledgment SLA/i)).toBeDefined();
      expect(screen.getByText(/30-Day Resolution Timeline/i)).toBeDefined();
    });

    // Test copy to clipboard
    const copyBtn = screen.getByRole('button', { name: /Copy Reference/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GRV-20260923-KLM890');

    // Test reset button
    const resetBtn = screen.getByRole('button', { name: /Register Another Inquiry/i });
    fireEvent.click(resetBtn);

    expect(screen.getByRole('button', { name: /Submit Grievance for Redressal/i })).toBeDefined();
  });

  it('displays error banner when API returns server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed. Please try again later.'
      })
    } as unknown as Response);

    render(<GrievanceForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Zehra Naqvi' }
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'zehra@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), {
      target: { value: '9876543210' }
    });
    fireEvent.change(screen.getByLabelText(/Detailed Statement of Grievance/i), {
      target: { value: 'This is a valid long grievance description for test.' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Grievance for Redressal/i }));

    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeDefined();
    });
  });
});
