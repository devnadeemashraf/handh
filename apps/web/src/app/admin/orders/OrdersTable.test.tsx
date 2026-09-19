import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrdersTable from './OrdersTable';
import type { Order } from '@hh/db';

type TestOrder = Order & { itemCount: number };

const mockOrders: TestOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'HH-2026-00001',
    storeId: 'store-1',
    status: 'paid',
    paymentStatus: 'captured',
    fulfillmentStatus: 'unfulfilled',
    customerName: 'Aarav Sharma',
    customerEmail: 'aarav@example.com',
    customerPhone: '+919876543210',
    shippingAddress: {
      line1: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      country: 'India'
    },
    couponCode: null,
    notes: null,
    subtotalMinor: 450000,
    shippingMinor: 0,
    discountMinor: 0,
    totalMinor: 450000,
    currency: 'INR',
    itemCount: 2,
    createdAt: new Date('2026-09-18T10:00:00Z'),
    updatedAt: new Date('2026-09-18T10:00:00Z')
  },
  {
    id: 'ord-2',
    orderNumber: 'HH-2026-00002',
    storeId: 'store-1',
    status: 'processing',
    paymentStatus: 'captured',
    fulfillmentStatus: 'unfulfilled',
    customerName: 'Priya Patel',
    customerEmail: 'priya@example.com',
    customerPhone: '+919811122233',
    shippingAddress: {
      line1: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560034',
      country: 'India'
    },
    couponCode: null,
    notes: null,
    subtotalMinor: 1200000,
    shippingMinor: 0,
    discountMinor: 0,
    totalMinor: 1200000,
    currency: 'INR',
    itemCount: 1,
    createdAt: new Date('2026-09-18T11:00:00Z'),
    updatedAt: new Date('2026-09-18T11:00:00Z')
  },
  {
    id: 'ord-3',
    orderNumber: 'HH-2026-00003',
    storeId: 'store-1',
    status: 'processing',
    paymentStatus: 'captured',
    fulfillmentStatus: 'shipped',
    customerName: 'Zoya Khan',
    customerEmail: 'zoya@example.com',
    customerPhone: '+919899988877',
    shippingAddress: {
      line1: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India'
    },
    couponCode: null,
    notes: null,
    subtotalMinor: 890000,
    shippingMinor: 0,
    discountMinor: 0,
    totalMinor: 890000,
    currency: 'INR',
    itemCount: 3,
    createdAt: new Date('2026-09-18T12:00:00Z'),
    updatedAt: new Date('2026-09-18T12:00:00Z')
  }
];

describe('OrdersTable Component', () => {
  it('renders empty queue state when no orders exist', () => {
    render(<OrdersTable initialOrders={[]} />);

    expect(screen.getByText('No orders in this queue')).toBeInTheDocument();
    expect(screen.getByText('All Orders (0)')).toBeInTheDocument();
  });

  it('renders orders list with customer names, formatted totals, and badges', () => {
    render(<OrdersTable initialOrders={mockOrders} />);

    expect(screen.getByText('HH-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText('+919876543210')).toBeInTheDocument();
    expect(screen.getByText('Ready to Pack')).toBeInTheDocument();

    expect(screen.getByText('HH-2026-00002')).toBeInTheDocument();
    expect(screen.getByText('Priya Patel')).toBeInTheDocument();

    expect(screen.getByText('HH-2026-00003')).toBeInTheDocument();
    expect(screen.getByText('Zoya Khan')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('filters orders by "To Pack" tab', () => {
    render(<OrdersTable initialOrders={mockOrders} />);

    const toPackBtn = screen.getByRole('button', { name: /to pack/i });
    fireEvent.click(toPackBtn);

    expect(screen.getByText('HH-2026-00001')).toBeInTheDocument();
    expect(screen.queryByText('HH-2026-00002')).not.toBeInTheDocument();
    expect(screen.queryByText('HH-2026-00003')).not.toBeInTheDocument();
  });

  it('filters orders by "Processing" tab', () => {
    render(<OrdersTable initialOrders={mockOrders} />);

    const processingBtn = screen.getByRole('button', { name: /processing/i });
    fireEvent.click(processingBtn);

    expect(screen.queryByText('HH-2026-00001')).not.toBeInTheDocument();
    expect(screen.getByText('HH-2026-00002')).toBeInTheDocument();
    expect(screen.getByText('HH-2026-00003')).toBeInTheDocument();
  });

  it('filters orders by "In Transit" tab', () => {
    render(<OrdersTable initialOrders={mockOrders} />);

    const inTransitBtn = screen.getByRole('button', { name: /in transit/i });
    fireEvent.click(inTransitBtn);

    expect(screen.queryByText('HH-2026-00001')).not.toBeInTheDocument();
    expect(screen.queryByText('HH-2026-00002')).not.toBeInTheDocument();
    expect(screen.getByText('HH-2026-00003')).toBeInTheDocument();
  });

  it('filters orders by search keyword on customer phone or order number', () => {
    render(<OrdersTable initialOrders={mockOrders} />);

    const searchInput = screen.getByPlaceholderText('Search order #, phone, name...');

    // Search by order number
    fireEvent.change(searchInput, { target: { value: '00002' } });
    expect(screen.queryByText('HH-2026-00001')).not.toBeInTheDocument();
    expect(screen.getByText('HH-2026-00002')).toBeInTheDocument();
    expect(screen.queryByText('HH-2026-00003')).not.toBeInTheDocument();

    // Search by customer phone
    fireEvent.change(searchInput, { target: { value: '8877' } });
    expect(screen.queryByText('HH-2026-00001')).not.toBeInTheDocument();
    expect(screen.queryByText('HH-2026-00002')).not.toBeInTheDocument();
    expect(screen.getByText('HH-2026-00003')).toBeInTheDocument();
  });

  it('shows no matches message and allows clearing search query', () => {
    render(<OrdersTable initialOrders={mockOrders} />);

    const searchInput = screen.getByPlaceholderText('Search order #, phone, name...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent_customer' } });

    expect(screen.getByText(/no orders matching "nonexistent_customer"/i)).toBeInTheDocument();

    // Clear search using the X button
    const clearBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(clearBtn);

    expect(screen.getByText('HH-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('HH-2026-00002')).toBeInTheDocument();
    expect(screen.getByText('HH-2026-00003')).toBeInTheDocument();
  });
});
