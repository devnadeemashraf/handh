import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { UserAddress } from '@hh/domain';

import { SavedAddressSelector } from './SavedAddressSelector';

describe('SavedAddressSelector Component', () => {
  const mockAddresses: UserAddress[] = [
    {
      id: 'addr-1',
      userId: 'usr-1',
      label: 'Home',
      recipientName: 'Maryam Siddiqui',
      phone: '+919876543210',
      line1: 'Flat 101, Palm Heights',
      line2: 'Near Metro Station',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500028',
      country: 'IN',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'addr-2',
      userId: 'usr-1',
      label: 'Studio',
      recipientName: 'Zainab Ahmed',
      phone: '8123456789',
      line1: 'Boutique 4B, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500033',
      country: 'IN',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  it('renders saved addresses with properly formatted phone numbers without double prefix', () => {
    const onSelect = vi.fn();
    const onSwitch = vi.fn();

    render(
      <SavedAddressSelector
        addresses={mockAddresses}
        selectedAddressId="addr-1"
        isManualAddress={false}
        onSelectAddress={onSelect}
        onSwitchToManual={onSwitch}
      />
    );

    // Should display cleanly formatted phone without duplicate +91
    expect(screen.getByText('Phone: +91 98765 43210')).toBeInTheDocument();
    expect(screen.getByText('Phone: +91 81234 56789')).toBeInTheDocument();
    expect(screen.queryByText(/Phone: \+91 \+91/)).not.toBeInTheDocument();
  });

  it('triggers selection handler when address card is clicked', () => {
    const onSelect = vi.fn();
    const onSwitch = vi.fn();

    render(
      <SavedAddressSelector
        addresses={mockAddresses}
        selectedAddressId="addr-1"
        isManualAddress={false}
        onSelectAddress={onSelect}
        onSwitchToManual={onSwitch}
      />
    );

    fireEvent.click(screen.getByText('Zainab Ahmed'));
    expect(onSelect).toHaveBeenCalledWith(mockAddresses[1]);
  });
});
