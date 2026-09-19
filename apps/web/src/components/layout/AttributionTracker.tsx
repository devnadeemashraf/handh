'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense,useEffect } from 'react';
import { captureAttributionFromBrowser, trackPageView } from '@/lib/analytics';

function AttributionCaptureInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture any incoming UTM or Instagram parameters
    captureAttributionFromBrowser();
    // Track page view event
    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    trackPageView(fullPath);
  }, [pathname, searchParams]);

  return null;
}

export function AttributionTracker() {
  return (
    <Suspense fallback={null}>
      <AttributionCaptureInner />
    </Suspense>
  );
}
