import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DEFAULT_STOREFRONT_CONFIG } from '@hh/domain';

import BrandCustomizerDashboard from './BrandCustomizerDashboard';

describe('BrandCustomizerDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial brand settings and live previews', () => {
    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    expect(screen.getByText('Brand & Storefront Customizer')).toBeInTheDocument();
    expect(screen.getByText('Storefront Announcement Ribbon')).toBeInTheDocument();
    expect(screen.getByText('Hero Showcase & Call to Action')).toBeInTheDocument();
    expect(screen.getByText('Reassurance Badges (3 Pillars)')).toBeInTheDocument();

    // Check live preview text
    expect(screen.getAllByText(DEFAULT_STOREFRONT_CONFIG.hero.title).length).toBeGreaterThan(0);
    expect(screen.getByText('Live Ribbon Preview')).toBeInTheDocument();
  });

  it('toggles announcement ribbon visibility', () => {
    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    const toggleBtn = screen.getByRole('button', { name: /disable announcement ribbon/i });
    expect(toggleBtn).toHaveTextContent('Ribbon Active');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Ribbon Hidden');
  });

  it('updates live hero preview when headline is edited', () => {
    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    const titleInput = screen.getByLabelText(/main headline/i);
    fireEvent.change(titleInput, { target: { value: 'New Royal Nose Pin Collection' } });

    // Live preview should now render the new headline
    expect(
      screen.getByRole('heading', { name: 'New Royal Nose Pin Collection' })
    ).toBeInTheDocument();
  });

  it('submits updated brand configuration to PATCH API and shows confirmation banner', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          ...DEFAULT_STOREFRONT_CONFIG,
          hero: {
            ...DEFAULT_STOREFRONT_CONFIG.hero,
            title: 'Royal Elegance Redefined'
          }
        }
      })
    });
    global.fetch = fetchMock;

    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    const titleInput = screen.getByLabelText(/main headline/i);
    fireEvent.change(titleInput, { target: { value: 'Royal Elegance Redefined' } });

    const submitBtn = screen.getByRole('button', { name: /save & publish storefront/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/settings/brand',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"title":"Royal Elegance Redefined"')
        })
      );
      expect(
        screen.getByText(/storefront brand configuration published successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('displays error alert when PATCH API rejects changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Database transaction timeout.'
      })
    });
    global.fetch = fetchMock;

    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    const submitBtn = screen.getByRole('button', { name: /save & publish storefront/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Database transaction timeout.')).toBeInTheDocument();
    });
  });

  it('renders a Live Storefront Preview link pointing to draft preview route', () => {
    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    const previewLink = screen.getByRole('link', { name: /live storefront preview/i });
    expect(previewLink).toBeInTheDocument();
    expect(previewLink).toHaveAttribute('href', '/api/draft/preview?path=/');
    expect(previewLink).toHaveAttribute('target', '_blank');
  });

  it('allows setting announcement link and includes it in payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    render(<BrandCustomizerDashboard initialConfig={DEFAULT_STOREFRONT_CONFIG} />);

    const linkInput = screen.getByLabelText(/ribbon target link/i);
    fireEvent.change(linkInput, { target: { value: '#catalog' } });

    const submitBtn = screen.getByRole('button', { name: /save & publish storefront/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/settings/brand',
        expect.objectContaining({
          body: expect.stringContaining('"link":"#catalog"')
        })
      );
    });
  });
});
