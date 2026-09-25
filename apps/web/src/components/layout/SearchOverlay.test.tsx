import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SearchOverlay } from './SearchOverlay';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const mockCloseSearch = vi.fn();
const mockOpenSearch = vi.fn();
const mockToggleSearch = vi.fn();
const mockAddRecentSearch = vi.fn();
const mockRemoveRecentSearch = vi.fn();
const mockClearRecentSearches = vi.fn();
const mockSetQuery = vi.fn();

let mockIsOpen = true;
let mockQuery = '';
let mockRecentSearches = ['Vintage Brooch', 'Gold Ring'];

vi.mock('@/context/SearchContext', () => ({
  useSearch: () => ({
    isOpen: mockIsOpen,
    closeSearch: mockCloseSearch,
    openSearch: mockOpenSearch,
    toggleSearch: mockToggleSearch,
    query: mockQuery,
    setQuery: mockSetQuery,
    recentSearches: mockRecentSearches,
    addRecentSearch: mockAddRecentSearch,
    removeRecentSearch: mockRemoveRecentSearch,
    clearRecentSearches: mockClearRecentSearches
  })
}));

describe('SearchOverlay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = true;
    mockQuery = '';
    mockRecentSearches = ['Vintage Brooch', 'Gold Ring'];
    global.fetch = vi.fn();
  });

  it('renders nothing when isOpen is false', () => {
    mockIsOpen = false;
    const { container } = render(<SearchOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders search overlay with input and popular search chips when open', () => {
    render(<SearchOverlay />);

    expect(screen.getByRole('dialog', { name: /search catalog/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search collections, abayas, jewelry/i)).toBeInTheDocument();
    expect(screen.getByText('Popular Searches')).toBeInTheDocument();
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Vintage Brooch')).toBeInTheDocument();
    expect(screen.getByText('Chiffon Hijab')).toBeInTheDocument();
  });

  it('calls closeSearch when clicking the backdrop scrim', () => {
    render(<SearchOverlay />);

    const scrim = screen.getByTestId('search-scrim');
    fireEvent.click(scrim);
    expect(mockCloseSearch).toHaveBeenCalled();
  });

  it('removes a recent search when clicking its delete button', () => {
    render(<SearchOverlay />);

    const removeBtn = screen.getByLabelText('Remove recent search Vintage Brooch');
    fireEvent.click(removeBtn);
    expect(mockRemoveRecentSearch).toHaveBeenCalledWith('Vintage Brooch');
  });

  it('calls setQuery when a popular search chip is clicked', () => {
    render(<SearchOverlay />);

    const popularChip = screen.getByRole('button', { name: 'Chiffon Hijab' });
    fireEvent.click(popularChip);
    expect(mockSetQuery).toHaveBeenCalledWith('Chiffon Hijab');
  });

  it('fetches search results when query is active and renders matches', async () => {
    mockQuery = 'abaya';

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            id: 'p-1',
            slug: 'noir-silk-abaya',
            title: 'Noir Silk Abaya',
            department: 'Abayas',
            startingPriceMinor: 599900,
            currency: 'INR',
            primaryImageUrl: '/abaya.jpg'
          }
        ],
        categories: [
          {
            id: 'c-1',
            name: 'Abayas & Modest Wear',
            slug: 'abayas'
          }
        ]
      })
    } as Response);

    render(<SearchOverlay />);

    await waitFor(
      () => {
        expect(screen.getByText('Noir Silk Abaya')).toBeInTheDocument();
        expect(screen.getByText('Abayas & Modest Wear')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Selecting a product
    fireEvent.click(screen.getByText('Noir Silk Abaya'));
    expect(mockAddRecentSearch).toHaveBeenCalledWith('Noir Silk Abaya');
    expect(mockCloseSearch).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/products/noir-silk-abaya');
  });

  it('renders no results message when query yields empty response', async () => {
    mockQuery = 'nonexistentxyz';

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        categories: []
      })
    } as Response);

    render(<SearchOverlay />);

    await waitFor(
      () => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
