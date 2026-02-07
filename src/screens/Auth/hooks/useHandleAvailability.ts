import React from 'react';
import { isHandleValidFormat } from '../../../services/handlePolicy';
import { HandleAvailabilityStatus } from '../../../services/handleRegistry';

export type HandleAvailability = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'error';

type Params = {
  handle: string;
  checkHandleAvailability: (handle: string) => Promise<HandleAvailabilityStatus>;
};

export function useHandleAvailability({ handle, checkHandleAvailability }: Params) {
  const [handleAvailability, setHandleAvailability] = React.useState<HandleAvailability>('idle');

  React.useEffect(() => {
    if (!handle) {
      setHandleAvailability('idle');
      return;
    }

    if (!isHandleValidFormat(handle)) {
      setHandleAvailability('idle');
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        setHandleAvailability('checking');
        const availability = await checkHandleAvailability(handle);
        if (!active) {
          return;
        }
        if (availability === 'available') {
          setHandleAvailability('available');
          return;
        }
        if (availability === 'taken') {
          setHandleAvailability('taken');
          return;
        }
        if (availability === 'reserved') {
          setHandleAvailability('reserved');
          return;
        }
        setHandleAvailability('idle');
      } catch {
        if (active) {
          setHandleAvailability('error');
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [checkHandleAvailability, handle]);

  return handleAvailability;
}
