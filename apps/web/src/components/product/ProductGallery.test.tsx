import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { PublicProductImage } from '@hh/domain';

import { ProductGallery } from './ProductGallery';

const mockImages: PublicProductImage[] = [
  {
    id: 'img-1',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    altText: 'Silk Hijab Front View',
    sortOrder: 1
  },
  {
    id: 'img-2',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    altText: 'Silk Hijab Texture Detail',
    sortOrder: 2
  }
];

// Mock WishlistButton
vi.mock('./WishlistButton', () => ({
  WishlistButton: () => <button aria-label="Mock Wishlist">Wishlist</button>
}));

describe('ProductGallery Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback when no images provided', () => {
    render(<ProductGallery images={[]} title="No Image Piece" />);
    expect(screen.getByText('No Image Available')).toBeInTheDocument();
  });

  it('renders images and priority badge', () => {
    render(
      <ProductGallery
        images={mockImages}
        title="Silk Hijab"
        badge={{ label: 'Sold Out', variant: 'secondary' }}
        productId="prod-1"
      />
    );

    // Check priority badge exists
    expect(screen.getAllByText('Sold Out').length).toBeGreaterThan(0);
    // Check wishlist button exists
    expect(screen.getAllByLabelText('Mock Wishlist').length).toBeGreaterThan(0);
  });

  it('opens fullscreen lightbox when an image is clicked and closes on close button', () => {
    render(<ProductGallery images={mockImages} title="Silk Hijab" />);

    // Click first desktop image card
    const firstImage = screen.getByRole('button', {
      name: /Open photo 1 of 2 in lightbox/i
    });
    fireEvent.click(firstImage);

    // Lightbox modal should be visible
    expect(screen.getByRole('dialog', { name: /Image Lightbox/i })).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Navigate to next image
    const nextButton = screen.getByRole('button', { name: /Next image/i });
    fireEvent.click(nextButton);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Close lightbox
    const closeBtn = screen.getByRole('button', { name: /Close Lightbox/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: /Image Lightbox/i })).not.toBeInTheDocument();
  });

  it('closes lightbox on Escape key press', () => {
    render(<ProductGallery images={mockImages} title="Silk Hijab" />);

    const firstImage = screen.getByRole('button', {
      name: /Open photo 1 of 2 in lightbox/i
    });
    fireEvent.click(firstImage);

    expect(screen.getByRole('dialog', { name: /Image Lightbox/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Image Lightbox/i })).not.toBeInTheDocument();
  });
});
