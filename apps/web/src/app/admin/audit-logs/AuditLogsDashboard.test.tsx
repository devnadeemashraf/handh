import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { AdminAuditLogEntry } from '@hh/domain';

import AuditLogsDashboard from './AuditLogsDashboard';

const mockLogs: AdminAuditLogEntry[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    adminEmail: 'admin@brand.com',
    action: 'settings:service_control_updated',
    entityType: 'store_settings',
    entityId: 'hh',
    details: {
      changes: { maintenanceMode: true }
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 TestBrowser',
    createdAt: '2026-09-24T10:00:00.000Z'
  },
  {
    id: 'log-2',
    adminId: 'admin-2',
    adminEmail: 'ops@brand.com',
    action: 'order:status_updated',
    entityType: 'order',
    entityId: 'ord-123',
    details: {
      newStatus: 'processing'
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 TestBrowser',
    createdAt: '2026-09-24T10:30:00.000Z'
  },
  {
    id: 'log-3',
    adminId: 'admin-1',
    adminEmail: 'admin@brand.com',
    action: 'inventory:price_updated',
    entityType: 'product_variant',
    entityId: 'var-456',
    details: {
      priceMinor: 499900
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 TestBrowser',
    createdAt: '2026-09-24T11:00:00.000Z'
  }
];

describe('AuditLogsDashboard Component (E-COM-073)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders audit ledger title, metric cards, and log rows', () => {
    render(<AuditLogsDashboard initialLogs={mockLogs} totalLogs={3} />);

    expect(screen.getByText('Administrative Mutation Audit Ledger')).toBeInTheDocument();
    expect(screen.getByText('Immutable')).toBeInTheDocument();
    expect(screen.getByText('Total Log Entries')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBe(2);

    // Verify row contents
    expect(screen.getByText('settings:service_control_updated')).toBeInTheDocument();
    expect(screen.getByText('order:status_updated')).toBeInTheDocument();
    expect(screen.getByText('inventory:price_updated')).toBeInTheDocument();
    expect(screen.getAllByText('admin@brand.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ops@brand.com')).toBeInTheDocument();
  });

  it('filters logs by search query keyword', () => {
    render(<AuditLogsDashboard initialLogs={mockLogs} totalLogs={3} />);

    const searchInput = screen.getByPlaceholderText(/Search by action, email/i);
    fireEvent.change(searchInput, { target: { value: 'ord-123' } });

    expect(screen.queryByText('settings:service_control_updated')).not.toBeInTheDocument();
    expect(screen.getByText('order:status_updated')).toBeInTheDocument();
    expect(screen.queryByText('inventory:price_updated')).not.toBeInTheDocument();
  });

  it('filters logs by entity category tab', () => {
    render(<AuditLogsDashboard initialLogs={mockLogs} totalLogs={3} />);

    const inventoryTab = screen.getByRole('button', { name: 'Inventory' });
    fireEvent.click(inventoryTab);

    expect(screen.queryByText('settings:service_control_updated')).not.toBeInTheDocument();
    expect(screen.queryByText('order:status_updated')).not.toBeInTheDocument();
    expect(screen.getByText('inventory:price_updated')).toBeInTheDocument();
  });

  it('opens detail inspection modal when Inspect button is clicked', () => {
    render(<AuditLogsDashboard initialLogs={mockLogs} totalLogs={3} />);

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    fireEvent.click(inspectButtons[0]!);

    expect(screen.getByText('Audit Record Details')).toBeInTheDocument();
    expect(screen.getByText('Recorded Payload State Diffs')).toBeInTheDocument();
    expect(screen.getByText(/maintenanceMode/i)).toBeInTheDocument();
  });

  it('refreshes logs when Refresh button is clicked', async () => {
    const refreshedLogs: AdminAuditLogEntry[] = [
      ...mockLogs,
      {
        id: 'log-4',
        adminId: 'admin-1',
        adminEmail: 'admin@brand.com',
        action: 'coupon:created',
        entityType: 'coupon',
        entityId: 'coup-1',
        details: { code: 'EID2026' },
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        createdAt: '2026-09-24T12:00:00.000Z'
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, logs: refreshedLogs, total: 4 })
    } as Response);

    render(<AuditLogsDashboard initialLogs={mockLogs} totalLogs={3} />);

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/audit-logs?limit=100');
    });

    await waitFor(() => {
      expect(screen.getByText('coupon:created')).toBeInTheDocument();
    });
  });
});
