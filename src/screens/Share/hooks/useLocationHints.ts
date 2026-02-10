import React from 'react';
import { LocationHint, searchLocationHints } from '../../../services/locationSearch';

type Params = {
  query: string;
  enabled: boolean;
  debounceMs?: number;
  limit?: number;
};

export function useLocationHints({
  query,
  enabled,
  debounceMs = 280,
  limit = 6,
}: Params) {
  const [hints, setHints] = React.useState<LocationHint[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const requestRef = React.useRef(0);

  React.useEffect(() => {
    let isCancelled = false;
    if (!enabled || !query.trim()) {
      setHints([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timer = setTimeout(() => {
      const loadHints = async () => {
        try {
          const results = await searchLocationHints(query, { limit });
          if (isCancelled || requestRef.current !== requestId) {
            return;
          }
          setHints(results);
        } catch {
          if (isCancelled || requestRef.current !== requestId) {
            return;
          }
          setHints([]);
        } finally {
          if (!isCancelled && requestRef.current === requestId) {
            setIsLoading(false);
          }
        }
      };

      void loadHints();
    }, debounceMs);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [debounceMs, enabled, limit, query]);

  return { hints, isLoading };
}
