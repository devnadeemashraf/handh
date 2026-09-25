import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as analyticsModule from '@/lib/analytics';
import { render } from '@testing-library/react';

import { ProductViewTracker } from './ProductViewTracker';

vi.mock('@/lib/analytics', () => ({
  trackProductView: vi.fn()
}));

describe('ProductViewTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires trackProductView on mount with correct props', () => {
    render(
      <ProductViewTracker
        productId="prod_abc123"
        productName="Luxury Abaya"
        priceMinor={450000}
        categoryName="Abayas"
      />
    );

    expect(analyticsModule.trackProductView).toHaveBeenCalledOnce();
    expect(analyticsModule.trackProductView).toHaveBeenCalledWith({
      productId: 'prod_abc123',
      productName: 'Luxury Abaya',
      priceMinor: 450000,
      categoryName: 'Abayas'
    });
  });

  it('fires trackProductView again when productId changes', () => {
    const { rerender } = render(
      <ProductViewTracker productId="prod_a" productName="Abaya A" priceMinor={100000} />
    );

    expect(analyticsModule.trackProductView).toHaveBeenCalledTimes(1);

    rerender(<ProductViewTracker productId="prod_b" productName="Abaya B" priceMinor={200000} />);

    expect(analyticsModule.trackProductView).toHaveBeenCalledTimes(2);
    expect(analyticsModule.trackProductView).toHaveBeenLastCalledWith({
      productId: 'prod_b',
      productName: 'Abaya B',
      priceMinor: 200000,
      categoryName: undefined
    });
  });

  it('renders nothing to the DOM', () => {
    const { container } = render(
      <ProductViewTracker productId="prod_abc" productName="Test" priceMinor={0} />
    );
    expect(container.firstChild).toBeNull();
  });
});
