import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryManager from './InventoryManager';
import type { AdminInventoryItem, AdminInventorySummary, InventoryAuditLogItem } from '@hh/domain';

describe('InventoryManager Component', () => {
  const mockItems: AdminInventoryItem[] = [
    {
      productId: 'prod-1',
      productTitle: 'Handcrafted Heritage Clip',
      productSlug: 'handcrafted-heritage-clip',
      productStatus: 'published',
      variantId: 'var-1',
      variantSku: 'SKU-CLP-01',
      variantTitle: 'Oxidised Silver Clip',
      priceMinor: 49900,
      currency: 'INR',
      onHand: 10,
      reserved: 2,
      available: 8,
      isLowStock: false,
      isOutOfStock: false,
      updatedAt: new Date().toISOString()
    },
    {
      productId: 'prod-2',
      productTitle: 'Artisan Pearl Nose Stud',
      productSlug: 'artisan-pearl-nose-stud',
      productStatus: 'published',
      variantId: 'var-2',
      variantSku: 'SKU-PRL-02',
      variantTitle: 'Natural Pearl / 925 Silver',
      priceMinor: 79900,
      currency: 'INR',
      onHand: 3,
      reserved: 1,
      available: 2,
      isLowStock: true, // <= 3
      isOutOfStock: false,
      updatedAt: new Date().toISOString()
    },
    {
      productId: 'prod-3',
      productTitle: 'Vintage Filigree Pin',
      productSlug: 'vintage-filigree-pin',
      productStatus: 'draft',
      variantId: 'var-3',
      variantSku: 'SKU-FLG-03',
      variantTitle: 'Antique Gold Finish',
      priceMinor: 89900,
      currency: 'INR',
      onHand: 0,
      reserved: 0,
      available: 0,
      isLowStock: false,
      isOutOfStock: true,
      updatedAt: new Date().toISOString()
    }
  ];

  const mockSummary: AdminInventorySummary = {
    totalVariants: 3,
    totalOnHand: 13,
    totalReserved: 3,
    totalAvailable: 10,
    lowStockCount: 1,
    outOfStockCount: 1
  };

  const mockAuditLogs: InventoryAuditLogItem[] = [
    {
      id: 'log-1',
      variantId: 'var-1',
      variantSku: 'SKU-CLP-01',
      productTitle: 'Handcrafted Heritage Clip',
      previousOnHand: 5,
      newOnHand: 10,
      delta: 5,
      reason: 'manual_restock',
      note: 'Fresh artisan shipment',
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders summary KPI scorecards with counts and metrics', () => {
    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    expect(screen.getByText('Inventory & Stock Command')).toBeInTheDocument();
    expect(screen.getByText('Available Stock')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // totalAvailable
    expect(screen.getByText('Low Stock (≤ 3)')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Total SKUs')).toBeInTheDocument();
  });

  it('renders items in table with SKUs, formatted prices, and stock counts', () => {
    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    expect(screen.getByRole('link', { name: 'Handcrafted Heritage Clip' })).toBeInTheDocument();
    expect(screen.getAllByText(/SKU-CLP-01/)[0]).toBeInTheDocument();
    expect(screen.getByText('₹499')).toBeInTheDocument();
    expect(screen.getByText('₹799')).toBeInTheDocument();
    expect(screen.getByText('₹899')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Artisan Pearl Nose Stud' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vintage Filigree Pin' })).toBeInTheDocument();
  });

  it('filters items when switching tabs (Needs Restock, Drafts, All)', () => {
    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    // Filter "Needs Restock" (should show prod-2 and prod-3)
    const needsRestockTab = screen.getByRole('button', { name: /Needs Restock/i });
    fireEvent.click(needsRestockTab);

    expect(
      screen.queryByRole('link', { name: 'Handcrafted Heritage Clip' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Artisan Pearl Nose Stud' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vintage Filigree Pin' })).toBeInTheDocument();

    // Filter "Drafts" (should only show prod-3)
    const draftsTab = screen.getByRole('button', { name: /Drafts/i });
    fireEvent.click(draftsTab);

    expect(screen.queryByRole('link', { name: 'Artisan Pearl Nose Stud' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vintage Filigree Pin' })).toBeInTheDocument();

    // Filter "All"
    const allTab = screen.getByRole('button', { name: /All SKUs/i });
    fireEvent.click(allTab);

    expect(screen.getByRole('link', { name: 'Handcrafted Heritage Clip' })).toBeInTheDocument();
  });

  it('searches items by title or SKU and clears search query', () => {
    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search piece by title or sku/i);
    fireEvent.change(searchInput, { target: { value: 'pearl' } });

    expect(screen.getByRole('link', { name: 'Artisan Pearl Nose Stud' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Handcrafted Heritage Clip' })
    ).not.toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByTitle(/clear search/i);
    fireEvent.click(clearBtn);

    expect(screen.getByRole('link', { name: 'Handcrafted Heritage Clip' })).toBeInTheDocument();
  });

  it('handles quick restock adjustment button click (+5)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        level: {
          variantId: 'var-1',
          onHand: 15,
          reserved: 2
        },
        auditLog: {
          id: 'log-new',
          variantId: 'var-1',
          previousOnHand: 10,
          newOnHand: 15,
          delta: 5,
          reason: 'manual_restock',
          createdAt: new Date().toISOString()
        }
      })
    });
    global.fetch = fetchMock;

    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    // Find row 1 and click "+5" button
    const plusFiveButtons = screen.getAllByRole('button', { name: /\+5/i });
    fireEvent.click(plusFiveButtons[0]!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: 'var-1',
          delta: 5,
          reason: 'manual_restock'
        })
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Successfully adjusted stock/i)).toBeInTheDocument();
    });
  });

  it('handles custom stock adjustment via modal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        level: {
          variantId: 'var-1',
          onHand: 20,
          reserved: 2
        },
        auditLog: {
          id: 'log-custom',
          variantId: 'var-1',
          previousOnHand: 10,
          newOnHand: 20,
          delta: 10,
          reason: 'manual_restock',
          note: 'Large festival batch',
          createdAt: new Date().toISOString()
        }
      })
    });
    global.fetch = fetchMock;

    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    const customButtons = screen.getAllByRole('button', { name: /Custom ±/i });
    fireEvent.click(customButtons[0]!);

    // Modal should appear
    expect(screen.getByText('Adjust Inventory Stock')).toBeInTheDocument();

    const noteInput = screen.getByPlaceholderText(/received shipment/i);
    fireEvent.change(noteInput, { target: { value: 'Large festival batch' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Adjustment/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/inventory/adjust',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  it('handles price update inline', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Price updated successfully'
      })
    });
    global.fetch = fetchMock;

    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    const editPriceButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editPriceButtons[0]!);

    const priceInput = screen.getByPlaceholderText(/Price ₹/i);
    fireEvent.change(priceInput, { target: { value: '549' } });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/inventory/price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: 'var-1',
          priceMinor: 54900
        })
      });
    });
  });

  it('handles product status toggle', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true
      })
    });
    global.fetch = fetchMock;

    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    const publishedBadge = screen.getAllByTitle(/click to toggle status/i)[0]!;
    fireEvent.click(publishedBadge);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/inventory/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'prod-1',
          status: 'draft'
        })
      });
    });
  });

  it('displays error alert when stock adjustment API fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Cannot adjust stock below reserved units (1 < 2 reserved)'
      })
    });
    global.fetch = fetchMock;

    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    const plusButtons = screen.getAllByRole('button', { name: /\+1/i });
    fireEvent.click(plusButtons[0]!);

    await waitFor(() => {
      expect(
        screen.getByText('Cannot adjust stock below reserved units (1 < 2 reserved)')
      ).toBeInTheDocument();
    });
  });

  it('renders recent audit logs timeline', () => {
    render(
      <InventoryManager
        initialItems={mockItems}
        initialSummary={mockSummary}
        initialAuditLogs={mockAuditLogs}
      />
    );

    expect(screen.getByText('Recent Inventory Movements')).toBeInTheDocument();
    expect(screen.getByText(/Fresh artisan shipment/)).toBeInTheDocument();
    expect(screen.getByText('+5 (5 → 10)')).toBeInTheDocument();
  });
});
