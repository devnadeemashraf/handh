'use client';

import * as React from 'react';

export function PwaRegister() {
  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration failed:', err);
      });
    }
  }, []);

  return null;
}
