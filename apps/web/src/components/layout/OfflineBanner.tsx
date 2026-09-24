'use client';

import { Wifi, WifiOff } from 'lucide-react';
import * as React from 'react';
import { triggerHaptic } from '@/lib/haptic';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      triggerHaptic('warning');
    };

    const handleOnline = () => {
      setIsOffline(false);
      triggerHaptic('success');
      // Hide reconnected banner after 3 seconds
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !wasOffline) {
    return null;
  }

  return (
    <aside
      aria-live="polite"
      role="status"
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full shadow-lg border text-xs font-medium backdrop-blur-md transition-all duration-300 select-none animate-in fade-in slide-in-from-top-4',
        isOffline
          ? 'bg-zinc-900/95 text-zinc-100 border-zinc-700/80 shadow-zinc-950/20'
          : 'bg-zinc-100/95 text-zinc-900 border-zinc-300 shadow-zinc-900/10'
      )}
    >
      {isOffline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <WifiOff className="h-3.5 w-3.5 text-amber-400" />
          <span>Offline mode &bull; Your bag is saved locally</span>
        </>
      ) : (
        <>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          <Wifi className="h-3.5 w-3.5 text-emerald-600" />
          <span>Connection restored &bull; Back online</span>
        </>
      )}
    </aside>
  );
}
