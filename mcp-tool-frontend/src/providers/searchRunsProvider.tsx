import { useCallback, useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import searchRunApi from '../api/searchRunApi.ts';
import type { RunSearchRequest, SearchRunResponse } from '../api/types/searchRun.ts';
import SearchRunsContext from '../contexts/searchRunsContext.ts';
import useSnackbar from '../hooks/useSnackbar.ts';
import { errorMessage } from '../api/errorMessage.ts';
import { texts } from '../ui/format.ts';

/**
 * Fully provided as the reference example of the provider pattern used in
 * this template — mirror it when you build the resources and donations
 * features.
 */
const SearchRunsProvider = ({ children }: { children: React.ReactNode }) => {
  const { showSnackbar } = useSnackbar();

  const [searchRuns, setSearchRuns] = useState<SearchRunResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const response = await searchRunApi.findAll();
      setSearchRuns(response.data);
    } catch (err) {
      showSnackbar(errorMessage(err, 'Пребарувањата не можеа да се вчитаат.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const onRun = useCallback(async (data: RunSearchRequest) => {
    try {
      const response = await searchRunApi.run(data);
      showSnackbar(`Пребарувањето заврши: ${texts(response.data.resultCount ?? 0)} од Викизвор.`, 'success');
    } catch (err) {
      showSnackbar(errorMessage(err, 'Пребарувањето не успеа.'), 'error');
    } finally {
      // A failed run is still stored (status FAILED), so always re-fetch.
      await refresh();
    }
  }, [refresh, showSnackbar]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ searchRuns, loading, onRun, refresh }),
    [searchRuns, loading, onRun, refresh]
  );

  return <SearchRunsContext value={value}>{children}</SearchRunsContext>;
};

export default SearchRunsProvider;
