import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { PublicProductListItem } from '@hh/domain';

import { QuickAddModal } from './QuickAddModal';

const mockAddItem = vi.fn();
const mockOpenCart = vi.fn();

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart
  })
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

const sampleProduct: PublicProductListItem = {
  id: 'prod-1',
  slug: 'royal-silk-abaya',
  title: 'Royal Silk Abaya',
  categoryName: 'Abayas',
  startingPriceMinor: 499900,
  compareAtPriceMinor: 599900,
  currency: 'INR',
  primaryImageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
  isAvailable: true,
  firstVariantId: 'var-1'
};

describe('QuickAddModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details and price inside modal', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'prod-1',
          slug: 'royal-silk-abaya',
          title: 'Royal Silk Abaya',
          variants: [
            { id: 'var-1', title: 'Size S', priceMinor: 499900, isAvailable: true },
            { id: 'var-2', title: 'Size M', priceMinor: 499900, isAvailable: true }
          ]
        }
      })
    });

    await act(async () => {
      render(<QuickAddModal product={sampleProduct} isOpen={true} onClose={vi.fn()} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Royal Silk Abaya')).toBeInTheDocument();
      expect(screen.getByText(/4,999/)).toBeInTheDocument();
    });
  });

  it('allows selecting variant and adding to cart with toast', async () => {
    mockAddItem.mockResolvedValueOnce(undefined);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'prod-1',
          slug: 'royal-silk-abaya',
          title: 'Royal Silk Abaya',
          variants: [
            { id: 'var-1', title: 'Size S', priceMinor: 499900, isAvailable: true },
            { id: 'var-2', title: 'Size M', priceMinor: 499900, isAvailable: true }
          ]
        }
      })
    });

    const onClose = vi.fn();
    render(<QuickAddModal product={sampleProduct} isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Size M')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Size M'));
    });

    const addBtn = screen.getByRole('button', { name: 'Add to Bag' });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(mockAddItem).toHaveBeenCalledWith('var-2', 1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'success'
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
