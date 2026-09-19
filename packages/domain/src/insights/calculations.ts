import type { InsightTimeframe } from './types';

/**
 * Calculates the Average Order Value (AOV) in minor units.
 */
export function calculateAov(revenueMinor: number, orderCount: number): number {
  if (orderCount <= 0 || revenueMinor <= 0) {
    return 0;
  }
  return Math.round(revenueMinor / orderCount);
}

/**
 * Calculates the customer repeat rate as a clean rounded percentage (0-100).
 */
export function calculateRepeatRate(repeatCustomers: number, totalCustomers: number): number {
  if (totalCustomers <= 0 || repeatCustomers <= 0) {
    return 0;
  }
  const rate = (repeatCustomers / totalCustomers) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Resolves the query start and end date boundary for a given timeframe filter.
 */
export function buildTimeframeDateRange(
  timeframe: InsightTimeframe,
  referenceDate: Date = new Date()
): { startDate: Date | null; endDate: Date } {
  const endDate = new Date(referenceDate);

  if (timeframe === 'all') {
    return { startDate: null, endDate };
  }

  const startDate = new Date(referenceDate);

  if (timeframe === 'today') {
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  if (timeframe === 'week') {
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  if (timeframe === 'month') {
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }

  return { startDate: null, endDate };
}

/**
 * Generates an encrypted/safe WhatsApp Concierge URL with prefilled VIP greeting.
 */
export function buildVipWhatsAppUrl(
  phone: string,
  customerName: string,
  brandName: string = 'H&H'
): string {
  const digits = phone.replace(/\D/g, '');
  const cleanPhone = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;

  const greeting = encodeURIComponent(
    `Hello ${customerName}! Thank you for being a valued patron of ${brandName}. We're reaching out from our atelier with appreciation for your continued support.`
  );

  return `https://wa.me/91${cleanPhone}?text=${greeting}`;
}
