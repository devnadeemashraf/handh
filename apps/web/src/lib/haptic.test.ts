import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { triggerHaptic } from './haptic';

describe('triggerHaptic utility', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
  });

  it('triggers selection haptic vibration when navigator.vibrate is supported', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true
    });

    triggerHaptic('selection');
    expect(vibrateMock).toHaveBeenCalledWith(8);
  });

  it('triggers success pattern for success feedback', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true
    });

    triggerHaptic('success');
    expect(vibrateMock).toHaveBeenCalledWith([10, 40, 15]);
  });

  it('triggers medium and heavy vibrations', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true
    });

    triggerHaptic('medium');
    expect(vibrateMock).toHaveBeenCalledWith(16);

    triggerHaptic('heavy');
    expect(vibrateMock).toHaveBeenCalledWith(30);

    triggerHaptic('warning');
    expect(vibrateMock).toHaveBeenCalledWith([20, 60, 20, 60, 20]);
  });

  it('gracefully degrades when navigator.vibrate is missing', () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
      writable: true
    });

    expect(() => triggerHaptic('light')).not.toThrow();
  });

  it('gracefully catches exceptions thrown by navigator.vibrate', () => {
    const vibrateMock = vi.fn().mockImplementation(() => {
      throw new Error('Vibration permission denied');
    });
    Object.defineProperty(global, 'navigator', {
      value: { vibrate: vibrateMock },
      configurable: true,
      writable: true
    });

    expect(() => triggerHaptic('selection')).not.toThrow();
  });
});
