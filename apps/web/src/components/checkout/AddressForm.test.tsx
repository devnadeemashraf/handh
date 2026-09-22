import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { AddressForm, type AddressFormValues } from './AddressForm';

describe('AddressForm Component', () => {
  const defaultValues: AddressFormValues = {
    fullName: 'Zainab Ahmed',
    phone: '9876543210',
    email: 'zainab@example.com',
    line1: 'House 12, Rose Lane',
    line2: 'Near Grand Mosque',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500001',
    country: 'IN'
  };

  it('renders phone input with 10 digits when values.phone is raw 10 digits', () => {
    const onChange = vi.fn();
    render(<AddressForm values={defaultValues} errors={{}} onChange={onChange} />);

    const phoneInput = screen.getByLabelText(/mobile number/i) as HTMLInputElement;
    expect(phoneInput.value).toBe('9876543210');
  });

  it('strips +91 prefix for clean input display when values.phone is formatted with +91 (E-COM-144)', () => {
    const onChange = vi.fn();
    const valuesWithPrefix = {
      ...defaultValues,
      phone: '+919876543210'
    };

    render(<AddressForm values={valuesWithPrefix} errors={{}} onChange={onChange} />);

    const phoneInput = screen.getByLabelText(/mobile number/i) as HTMLInputElement;
    expect(phoneInput.value).toBe('9876543210');
  });

  it('normalizes autofilled numbers with +91 or 91 country code without truncation (E-COM-144)', () => {
    const onChange = vi.fn();
    render(
      <AddressForm values={{ ...defaultValues, phone: '' }} errors={{}} onChange={onChange} />
    );

    const phoneInput = screen.getByLabelText(/mobile number/i) as HTMLInputElement;

    // Simulate browser autofill of +919876543210
    fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
    expect(onChange).toHaveBeenCalledWith('phone', '9876543210');

    // Simulate browser autofill of 919876543210 (without +)
    fireEvent.change(phoneInput, { target: { value: '919876543210' } });
    expect(onChange).toHaveBeenCalledWith('phone', '9876543210');

    // Simulate browser autofill of 09876543210 (trunk prefix)
    fireEvent.change(phoneInput, { target: { value: '09876543210' } });
    expect(onChange).toHaveBeenCalledWith('phone', '9876543210');
  });

  it('allows natural character typing up to 10 digits', () => {
    const onChange = vi.fn();
    render(
      <AddressForm values={{ ...defaultValues, phone: '' }} errors={{}} onChange={onChange} />
    );

    const phoneInput = screen.getByLabelText(/mobile number/i) as HTMLInputElement;

    fireEvent.change(phoneInput, { target: { value: '987' } });
    expect(onChange).toHaveBeenCalledWith('phone', '987');
  });

  it('displays field errors when provided', () => {
    const onChange = vi.fn();
    render(
      <AddressForm
        values={defaultValues}
        errors={{ phone: 'Please enter a valid 10-digit Indian mobile number' }}
        onChange={onChange}
      />
    );

    expect(
      screen.getByText('Please enter a valid 10-digit Indian mobile number')
    ).toBeInTheDocument();
  });
});
