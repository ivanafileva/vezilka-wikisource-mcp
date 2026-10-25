import { useEffect, useState } from 'react';
import searchRunApi from '../api/searchRunApi.ts';
import type { SearchRunResponse } from '../api/types/searchRun.ts';

/**
 * The list of search runs, for the "search run" select in the resource
 * filters. Failures are silent — the filter simply has no options.
 */
const useSearchRunOptions = () => {
  const [searchRuns, setSearchRuns] = useState<SearchRunResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    searchRunApi.findAll()
      .then((response) => {
        if (!cancelled) {
          setSearchRuns(response.data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return { searchRuns };
};

export default useSearchRunOptions;
