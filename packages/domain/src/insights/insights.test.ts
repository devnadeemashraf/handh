import { describe, it, expect } from 'vitest';
import {
  calculateAov,
  calculateRepeatRate,
  buildTimeframeDateRange,
  buildVipWhatsAppUrl
} from './calculations';

describe('Executive Insights Domain Calculations', () => {
  it('calculates Average Order Value (AOV) in minor units correctly', () => {
    expect(calculateAov(100000, 2)).toBe(50000);
    expect(calculateAov(125050, 3)).toBe(41683);
    expect(calculateAov(0, 5)).toBe(0);
    expect(calculateAov(50000, 0)).toBe(0);
    expect(calculateAov(-100, 2)).toBe(0);
  });

  it('calculates repeat customer rate percentage correctly', () => {
    expect(calculateRepeatRate(25, 100)).toBe(25);
    expect(calculateRepeatRate(1, 3)).toBe(33.3);
    expect(calculateRepeatRate(0, 50)).toBe(0);
    expect(calculateRepeatRate(10, 0)).toBe(0);
  });

  it('builds date ranges accurately based on timeframe parameter', () => {
    const fixedNow = new Date('2026-09-19T14:30:00Z');

    const todayRange = buildTimeframeDateRange('today', fixedNow);
    expect(todayRange.startDate).not.toBeNull();
    expect(todayRange.startDate?.getHours()).toBe(0);
    expect(todayRange.startDate?.getMinutes()).toBe(0);
    expect(todayRange.endDate.toISOString()).toBe(fixedNow.toISOString());

    const weekRange = buildTimeframeDateRange('week', fixedNow);
    expect(weekRange.startDate).not.toBeNull();
    const diffDays =
      (weekRange.endDate.getTime() - (weekRange.startDate?.getTime() ?? 0)) / (1000 * 3600 * 24);
    expect(Math.floor(diffDays)).toBe(7);

    const monthRange = buildTimeframeDateRange('month', fixedNow);
    expect(monthRange.startDate).not.toBeNull();
    const monthDiffDays =
      (monthRange.endDate.getTime() - (monthRange.startDate?.getTime() ?? 0)) / (1000 * 3600 * 24);
    expect(Math.floor(monthDiffDays)).toBe(30);

    const allRange = buildTimeframeDateRange('all', fixedNow);
    expect(allRange.startDate).toBeNull();
  });

  it('formats VIP WhatsApp Concierge link with sanitized phone and encoded message', () => {
    const url = buildVipWhatsAppUrl('+91 98765 43210', 'Zoya Khan', 'H&H Atelier');
    expect(url).toContain('https://wa.me/919876543210');
    expect(url).toContain('Zoya%20Khan');
    expect(url).toContain('H%26H%20Atelier');
  });
});
