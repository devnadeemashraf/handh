export type StoreOperatingStatus = 'active' | 'maintenance';

export interface ServiceControlConfig {
  operatingStatus: StoreOperatingStatus;
  checkoutEnabled: boolean;
  paymentsEnabled: boolean;
  headline: string;
  maintenanceNotice: string;
}
