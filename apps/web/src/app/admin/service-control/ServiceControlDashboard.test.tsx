import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceControlDashboard from './ServiceControlDashboard';
import type { ServiceControlConfig } from '@hh/domain';

const mockDefaultConfig: ServiceControlConfig = {
  operatingStatus: 'active',
  checkoutEnabled: true,
  paymentsEnabled: true,
  headline: 'Checkout & Payments Temporarily Paused',
  maintenanceNotice:
    'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'
};

describe('ServiceControlDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial configuration with healthy operational badge', () => {
    render(<ServiceControlDashboard initialConfig={mockDefaultConfig} />);

    expect(screen.getByText('Granular Service Control & Circuit Breakers')).toBeInTheDocument();
    expect(screen.getByText('ALL SYSTEMS OPERATIONAL')).toBeInTheDocument();
    expect(screen.getByText('Emergency Pause All Checkouts')).toBeInTheDocument();
    expect(screen.getByText('Restore All Live Operations')).toBeInTheDocument();

    // Check switches
    expect(screen.getByRole('button', { name: /^disable checkout$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^disable payments$/i })).toBeInTheDocument();

    // Check preview
    expect(screen.getByText('Customer Storefront Preview')).toBeInTheDocument();
  });

  it('performs emergency pause on single click', () => {
    render(<ServiceControlDashboard initialConfig={mockDefaultConfig} />);

    const emergencyPauseBtn = screen.getByRole('button', {
      name: /^emergency pause all checkouts/i
    });
    fireEvent.click(emergencyPauseBtn);

    expect(screen.getByText('MAINTENANCE MODE ACTIVE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^enable checkout$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^enable payments$/i })).toBeInTheDocument();
  });

  it('restores all operations on restore click', () => {
    const pausedConfig: ServiceControlConfig = {
      operatingStatus: 'maintenance',
      checkoutEnabled: false,
      paymentsEnabled: false,
      headline: 'System Paused',
      maintenanceNotice: 'Temporarily down.'
    };

    render(<ServiceControlDashboard initialConfig={pausedConfig} />);

    expect(screen.getByText('MAINTENANCE MODE ACTIVE')).toBeInTheDocument();

    const restoreBtn = screen.getByRole('button', { name: /^restore all live operations/i });
    fireEvent.click(restoreBtn);

    expect(screen.getByText('ALL SYSTEMS OPERATIONAL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^disable checkout$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^disable payments$/i })).toBeInTheDocument();
  });

  it('allows granular toggle of individual checkout and payment services', () => {
    render(<ServiceControlDashboard initialConfig={mockDefaultConfig} />);

    const checkoutToggle = screen.getByRole('button', { name: /^disable checkout$/i });
    fireEvent.click(checkoutToggle);

    // Checkout paused, payments still active -> overall badge is maintenance
    expect(screen.getByText('MAINTENANCE MODE ACTIVE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^enable checkout$/i })).toBeInTheDocument();

    const paymentToggle = screen.getByRole('button', { name: /^disable payments$/i });
    fireEvent.click(paymentToggle);
    expect(screen.getByRole('button', { name: /^enable payments$/i })).toBeInTheDocument();
  });

  it('updates notice banner when selecting a quick preset', () => {
    render(<ServiceControlDashboard initialConfig={mockDefaultConfig} />);

    const presetBtn = screen.getByRole('button', { name: /inventory reconciliation/i });
    fireEvent.click(presetBtn);

    const textarea = screen.getByLabelText(/notice banner text/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain(
      'Our workshop inventory is undergoing real-time synchronization'
    );
  });

  it('submits updated settings to PATCH API and displays success banner', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        serviceControl: {
          ...mockDefaultConfig,
          operatingStatus: 'maintenance'
        }
      })
    });
    global.fetch = fetchMock;

    render(<ServiceControlDashboard initialConfig={mockDefaultConfig} />);

    // Switch to maintenance
    const maintenanceBtn = screen.getByRole('button', { name: /^maintenance$/i });
    fireEvent.click(maintenanceBtn);

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /save & apply controls/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/settings/service-control',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"operatingStatus":"maintenance"')
        })
      );
      expect(
        screen.getByText(/service control configuration published successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('handles server API failure gracefully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to apply circuit breaker settings.'
      })
    });
    global.fetch = fetchMock;

    render(<ServiceControlDashboard initialConfig={mockDefaultConfig} />);

    const submitBtn = screen.getByRole('button', { name: /save & apply controls/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to apply circuit breaker settings.')).toBeInTheDocument();
    });
  });
});
