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

  it('displays inline unserviceable notice when unserviceable PIN code is entered (E-COM-063)', () => {
    const onChange = vi.fn();
    render(
      <AddressForm
        values={{ ...defaultValues, postalCode: '790001' }}
        errors={{}}
        onChange={onChange}
      />
    );

    expect(
      screen.getByText('Delivery is currently not available to PIN 790001.')
    ).toBeInTheDocument();
  });

  it('restricts PIN code input to 6 numeric digits and strips non-digits', () => {
    const onChange = vi.fn();
    render(
      <AddressForm values={{ ...defaultValues, postalCode: '' }} errors={{}} onChange={onChange} />
    );

    const pinInput = screen.getByLabelText(/PIN Code/i);
    fireEvent.change(pinInput, { target: { value: '500-034-ABC' } });

    expect(onChange).toHaveBeenCalledWith('postalCode', '500034');
  });

  it('dispatches onChange for all address input fields', () => {
    const onChange = vi.fn();
    render(<AddressForm values={defaultValues} errors={{}} onChange={onChange} />);

    // Full name
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Fatima Khan' } });
    expect(onChange).toHaveBeenCalledWith('fullName', 'Fatima Khan');

    // Email
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'fatima@example.com' }
    });
    expect(onChange).toHaveBeenCalledWith('email', 'fatima@example.com');

    // Line 1
    fireEvent.change(screen.getByLabelText(/Flat \/ House No\./i), {
      target: { value: 'Flat 502, Pearl Towers' }
    });
    expect(onChange).toHaveBeenCalledWith('line1', 'Flat 502, Pearl Towers');

    // Line 2
    fireEvent.change(screen.getByLabelText(/Landmark \/ Area/i), {
      target: { value: 'Near Jubilee Hills Checkpost' }
    });
    expect(onChange).toHaveBeenCalledWith('line2', 'Near Jubilee Hills Checkpost');

    // City
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Secunderabad' } });
    expect(onChange).toHaveBeenCalledWith('city', 'Secunderabad');

    // State select
    fireEvent.change(screen.getByLabelText(/State \/ UT/i), { target: { value: 'Karnataka' } });
    expect(onChange).toHaveBeenCalledWith('state', 'Karnataka');

    // Customer notes
    fireEvent.change(screen.getByLabelText(/Special Instructions/i), {
      target: { value: 'Handle with care' }
    });
    expect(onChange).toHaveBeenCalledWith('customerNotes', 'Handle with care');
  });

  it('disables all inputs and select dropdown when disabled is true', () => {
    const onChange = vi.fn();
    render(<AddressForm values={defaultValues} errors={{}} onChange={onChange} disabled={true} />);

    expect(screen.getByLabelText(/Full Name/i)).toBeDisabled();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeDisabled();
    expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
    expect(screen.getByLabelText(/Flat \/ House No\./i)).toBeDisabled();
    expect(screen.getByLabelText(/PIN Code/i)).toBeDisabled();
    expect(screen.getByLabelText(/City/i)).toBeDisabled();
    expect(screen.getByLabelText(/State \/ UT/i)).toBeDisabled();
    expect(screen.getByLabelText(/Special Instructions/i)).toBeDisabled();
  });

  it('renders multiple field error messages simultaneously', () => {
    const onChange = vi.fn();
    render(
      <AddressForm
        values={defaultValues}
        errors={{
          fullName: 'Full name is required',
          line1: 'Street address is required',
          city: 'City is required',
          state: 'State is required'
        }}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Street address is required')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(screen.getByText('State is required')).toBeInTheDocument();
  });
});
