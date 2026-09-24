/**
 * Resilient client-side haptic feedback utility.
 * Triggers subtle physical haptic vibrations on supporting mobile hardware
 * (iOS Safari and modern Android Chrome) with graceful no-op on desktop or unsupported devices.
 */
export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

export function triggerHaptic(type: HapticFeedbackType = 'selection'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    switch (type) {
      case 'light':
      case 'selection':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(16);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([10, 40, 15]);
        break;
      case 'warning':
        navigator.vibrate([20, 60, 20, 60, 20]);
        break;
      default:
        navigator.vibrate(8);
    }
  } catch {
    // Non-fatal safety guard
  }
}
