import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { CheckoutOrderResult } from '@hh/domain';

import { OrderSuccessView } from './OrderSuccessView';

describe('OrderSuccessView Component', () => {
  const sampleOrder: CheckoutOrderResult = {
    orderId: '11111111-2222-3333-4444-555555555555',
    orderNumber: 'HH-2026-0924-A1B2',
    currency: 'INR',
    subtotalMinor: 259800,
    shippingMinor: 0,
    totalMinor: 259800,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    receiptToken: 'token-abc-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order number, active hold window header, and formatted timer', () => {
    const onLaunchGateway = vi.fn();

    render(
      <OrderSuccessView
        orderPlaced={sampleOrder}
        reservationRemainingSecs={899} // 14 mins 59 secs
        isProcessingPayment={false}
        onLaunchGateway={onLaunchGateway}
      />
    );

    expect(screen.getByText('Order Reserved')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Payment Confirmation')).toBeInTheDocument();
    expect(screen.getByText('HH-2026-0924-A1B2')).toBeInTheDocument();
    expect(screen.getByText(/Time Remaining to Complete Payment: 14:59/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your handcrafted pieces have been reserved exclusively for you/i)
    ).toBeInTheDocument();
  });

  it('copies order reference to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });

    const onLaunchGateway = vi.fn();
    render(
      <OrderSuccessView
        orderPlaced={sampleOrder}
        reservationRemainingSecs={600}
        isProcessingPayment={false}
        onLaunchGateway={onLaunchGateway}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Copy order number/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('HH-2026-0924-A1B2');
  });

  it('invokes onLaunchGateway when Open Payment Window button is clicked', () => {
    const onLaunchGateway = vi.fn();
    render(
      <OrderSuccessView
        orderPlaced={sampleOrder}
        reservationRemainingSecs={600}
        isProcessingPayment={false}
        onLaunchGateway={onLaunchGateway}
      />
    );

    const payButton = screen.getByRole('button', { name: /Open Payment Window/i });
    fireEvent.click(payButton);

    expect(onLaunchGateway).toHaveBeenCalledWith(sampleOrder);
  });

  it('renders loading spinner and disables trigger when isProcessingPayment is true', () => {
    const onLaunchGateway = vi.fn();
    render(
      <OrderSuccessView
        orderPlaced={sampleOrder}
        reservationRemainingSecs={600}
        isProcessingPayment={true}
        onLaunchGateway={onLaunchGateway}
      />
    );

    const loadingButton = screen.getByRole('button', {
      name: /Processing Payment Gateway.../i
    });
    expect(loadingButton).toBeDisabled();
  });

  it('invokes onCancelReservation when Modify Bag button is clicked', () => {
    const onLaunchGateway = vi.fn();
    const onCancelReservation = vi.fn();

    render(
      <OrderSuccessView
        orderPlaced={sampleOrder}
        reservationRemainingSecs={600}
        isProcessingPayment={false}
        onLaunchGateway={onLaunchGateway}
        onCancelReservation={onCancelReservation}
      />
    );

    const cancelButton = screen.getByRole('button', {
      name: /Modify Bag \/ Return to Checkout/i
    });
    fireEvent.click(cancelButton);

    expect(onCancelReservation).toHaveBeenCalledTimes(1);
  });

  it('renders expired notice when reservationRemainingSecs is 0 or negative', () => {
    const onLaunchGateway = vi.fn();
    const onCancelReservation = vi.fn();

    render(
      <OrderSuccessView
        orderPlaced={sampleOrder}
        reservationRemainingSecs={0}
        isProcessingPayment={false}
        onLaunchGateway={onLaunchGateway}
        onCancelReservation={onCancelReservation}
      />
    );

    expect(screen.getByText('Reservation Expired')).toBeInTheDocument();
    expect(screen.getByText('Hold Window Expired')).toBeInTheDocument();
    expect(screen.getByText('Hold window expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open Payment Window/i })).not.toBeInTheDocument();

    const returnBtn = screen.getByRole('button', { name: /Return to Checkout Form/i });
    fireEvent.click(returnBtn);
    expect(onCancelReservation).toHaveBeenCalledTimes(1);
  });
});
