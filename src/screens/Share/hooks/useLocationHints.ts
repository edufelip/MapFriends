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
    if (!enabled || !query.trim()) {
      setHints([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const timer = setTimeout(async () => {
      const results = await searchLocationHints(query, { limit });
      if (requestRef.current !== requestId) {
        return;
      }
      setHints(results);
      setIsLoading(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [debounceMs, enabled, limit, query]);

  return { hints, isLoading };
}
