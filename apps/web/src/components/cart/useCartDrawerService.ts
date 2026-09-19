import * as React from 'react';

import type { ServiceControlConfig } from '@hh/domain';

export function useCartDrawerService(isOpen: boolean) {
  const [serviceControl, setServiceControl] = React.useState<ServiceControlConfig | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    fetch('/api/service-status')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.serviceControl) {
          setServiceControl(data.serviceControl);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const isServicePaused =
    serviceControl !== null &&
    (!serviceControl.checkoutEnabled ||
      !serviceControl.paymentsEnabled ||
      serviceControl.operatingStatus === 'maintenance');

  return { serviceControl, isServicePaused };
}
