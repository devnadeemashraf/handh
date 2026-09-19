import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ExecutiveInsightsData } from '@hh/domain';

import InsightsDashboard from './InsightsDashboard';

const mockInsightsData: ExecutiveInsightsData = {
  timeframe: 'week',
  sales: {
    revenueMinor: 485000,
    orderCount: 4,
    aovMinor: 121250,
    pendingFulfillmentCount: 2
  },
  customers: {
    totalCustomers: 3,
    repeatCustomers: 1,
    repeatRatePercentage: 33.3,
    topCustomers: [
      {
        customerEmail: 'amina@example.com',
        customerName: 'Amina Begum',
        customerPhone: '+919876543210',
        orderCount: 2,
        totalSpendMinor: 245000,
        firstOrderAt: '2026-09-10T10:00:00Z',
        lastOrderAt: '2026-09-18T14:30:00Z',
        isRepeatCustomer: true
      },
      {
        customerEmail: 'zoya@example.com',
        customerName: 'Zoya Khan',
        customerPhone: '+919123456789',
        orderCount: 1,
        totalSpendMinor: 140000,
        firstOrderAt: '2026-09-15T12:00:00Z',
        lastOrderAt: '2026-09-15T12:00:00Z',
        isRepeatCustomer: false
      }
    ]
  },
  productVelocity: [
    {
      productId: 'p1',
      productTitle: 'Handcrafted Polki Nose Ring',
      variantTitle: '24K Gold Plated',
      sku: 'NOSE-POLKI-GLD',
      unitsSold: 5,
      revenueMinor: 449500,
      currentStock: 8
    },
    {
      productId: 'p2',
      productTitle: 'Silver Crescent Clip',
      variantTitle: '925 Silver',
      sku: 'CLIP-SLV-01',
      unitsSold: 2,
      revenueMinor: 179800,
      currentStock: 1
    }
  ],
  attribution: {
    channels: [
      {
        source: 'instagram',
        orderCount: 3,
        revenueMinor: 363750,
        percentage: 75
      },
      {
        source: 'direct',
        orderCount: 1,
        revenueMinor: 121250,
        percentage: 25
      }
    ],
    topCampaigns: [
      {
        campaign: 'eid_al_fitr_drop',
        source: 'instagram',
        orderCount: 3,
        revenueMinor: 363750
      }
    ]
  }
};

describe('InsightsDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders executive header and all 4 KPI scorecards with formatted amounts', () => {
    render(<InsightsDashboard initialInsights={mockInsightsData} />);

    // Header
    expect(screen.getByText('Executive Insights & Intelligence')).toBeInTheDocument();

    // KPIs
    expect(screen.getByText('Gross Revenue')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-gross-revenue')).toHaveTextContent('₹4,850');

    expect(screen.getByText('Paid Orders')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-paid-orders')).toHaveTextContent('4');

    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-aov')).toHaveTextContent('₹1,213');

    expect(screen.getByText('Pending Packaging')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-pending-fulfillment')).toHaveTextContent('2');
  });

  it('renders customer retention metrics, repeat rate, and top patrons with WhatsApp concierge button', () => {
    render(<InsightsDashboard initialInsights={mockInsightsData} />);

    // Retention metrics
    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getByText('Total Patrons:')).toBeInTheDocument();
    expect(screen.getByText('Repeat Patrons:')).toBeInTheDocument();

    // Top patron table
    expect(screen.getByText('Amina Begum')).toBeInTheDocument();
    expect(screen.getByText('Repeat VIP')).toBeInTheDocument();
    expect(screen.getByText('₹2,450')).toBeInTheDocument();
    expect(screen.getByText('Zoya Khan')).toBeInTheDocument();

    // WhatsApp Concierge Link
    const waLinks = screen.getAllByRole('link', { name: /vip concierge/i });
    expect(waLinks.length).toBe(2);
    expect(waLinks[0]).toHaveAttribute('href', expect.stringContaining('wa.me/919876543210'));
    expect(waLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('renders product sales velocity leaderboard with units sold and stock badges', () => {
    render(<InsightsDashboard initialInsights={mockInsightsData} />);

    // Product velocity items
    expect(screen.getByText('Handcrafted Polki Nose Ring')).toBeInTheDocument();
    expect(screen.getByText('NOSE-POLKI-GLD')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // 5 units sold
    expect(screen.getByText('8 in stock')).toBeInTheDocument();

    expect(screen.getByText('Silver Crescent Clip')).toBeInTheDocument();
    expect(screen.getByText('CLIP-SLV-01')).toBeInTheDocument();
    expect(screen.getByText('1 left (Low)')).toBeInTheDocument();
  });

  it('renders marketing channel attribution and top campaign breakdowns', () => {
    render(<InsightsDashboard initialInsights={mockInsightsData} />);

    expect(screen.getByText('Channel Attribution & Traffic Share')).toBeInTheDocument();
    expect(screen.getByText('75% Instagram')).toBeInTheDocument();
    expect(screen.getByText('Instagram (Reel / Bio)')).toBeInTheDocument();
    expect(screen.getByText('Top Campaigns & Influencers')).toBeInTheDocument();
    expect(screen.getByText('eid_al_fitr_drop')).toBeInTheDocument();
  });

  it('switches timeframes by fetching updated insights data', async () => {
    const updatedInsights: ExecutiveInsightsData = {
      ...mockInsightsData,
      timeframe: 'month',
      sales: {
        revenueMinor: 1250000,
        orderCount: 10,
        aovMinor: 125000,
        pendingFulfillmentCount: 0
      }
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, insights: updatedInsights })
    });
    global.fetch = fetchMock;

    render(<InsightsDashboard initialInsights={mockInsightsData} />);

    const monthTabBtn = screen.getByRole('tab', { name: /this month/i });
    fireEvent.click(monthTabBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/insights?timeframe=month');
      expect(screen.getByText('₹12,500')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('handles empty customer and product velocity state gracefully', () => {
    const emptyInsights: ExecutiveInsightsData = {
      timeframe: 'today',
      sales: {
        revenueMinor: 0,
        orderCount: 0,
        aovMinor: 0,
        pendingFulfillmentCount: 0
      },
      customers: {
        totalCustomers: 0,
        repeatCustomers: 0,
        repeatRatePercentage: 0,
        topCustomers: []
      },
      productVelocity: []
    };

    render(<InsightsDashboard initialInsights={emptyInsights} />);

    expect(
      screen.getByText('No customer orders captured yet for this timeframe.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('No sales recorded yet for products in this timeframe.')
    ).toBeInTheDocument();
  });
});
