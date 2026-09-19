import { describe, it, expect } from 'vitest';
import {
  defaultServiceControlConfig,
  ServiceControlConfigSchema,
  resolveServiceControl
} from './config';

describe('Service Control Domain Config & Resolver', () => {
  it('provides default active operating status with both services enabled', () => {
    expect(defaultServiceControlConfig.operatingStatus).toBe('active');
    expect(defaultServiceControlConfig.checkoutEnabled).toBe(true);
    expect(defaultServiceControlConfig.paymentsEnabled).toBe(true);
    expect(defaultServiceControlConfig.maintenanceNotice).toContain('upgrading our payment');
  });

  it('validates and parses valid partial service control settings', () => {
    const parsed = ServiceControlConfigSchema.parse({
      checkoutEnabled: false,
      maintenanceNotice: 'Payments undergoing routine maintenance.'
    });

    expect(parsed.operatingStatus).toBe('active');
    expect(parsed.checkoutEnabled).toBe(false);
    expect(parsed.paymentsEnabled).toBe(true);
    expect(parsed.maintenanceNotice).toBe('Payments undergoing routine maintenance.');
  });

  it('safely resolves fallback defaults when given invalid or missing inputs', () => {
    expect(resolveServiceControl(null)).toEqual(defaultServiceControlConfig);
    expect(resolveServiceControl(undefined)).toEqual(defaultServiceControlConfig);
    expect(resolveServiceControl('invalid')).toEqual(defaultServiceControlConfig);

    const resolved = resolveServiceControl({
      operatingStatus: 'maintenance',
      checkoutEnabled: false,
      paymentsEnabled: false,
      headline: 'Emergency Maintenance',
      maintenanceNotice: 'Payment gateway paused.'
    });

    expect(resolved.operatingStatus).toBe('maintenance');
    expect(resolved.checkoutEnabled).toBe(false);
    expect(resolved.paymentsEnabled).toBe(false);
    expect(resolved.headline).toBe('Emergency Maintenance');
    expect(resolved.maintenanceNotice).toBe('Payment gateway paused.');
  });
});
