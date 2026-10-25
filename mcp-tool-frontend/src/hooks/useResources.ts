import { useCallback, useEffect, useState } from 'react';
import resourceApi from '../api/resourceApi.ts';
import type { PageResponse, ResourceFilter, ResourceResponse } from '../api/types/resource.ts';
import { errorMessage } from '../api/errorMessage.ts';
import useSnackbar from './useSnackbar.ts';

/**
 * Loads one page of resources for the ResourcesPage, re-fetching whenever the
 * filter or the page changes, and exposes the delete/analyze actions (each
 * re-fetches the current page afterwards).
 */
const useResources = (filter: ResourceFilter, page: number, size: number) => {
  const { showSnackbar } = useSnackbar();

  const [resources, setResources] = useState<PageResponse<ResourceResponse> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await resourceApi.findAll(filter, page, size);
      setResources(response.data);
    } catch (err) {
      showSnackbar(errorMessage(err, 'Текстовите не можеа да се вчитаат.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, page, size, showSnackbar]);

  const onDelete = useCallback(async (id: number) => {
    setBusyId(id);
    try {
      await resourceApi.delete(String(id));
      showSnackbar('Текстот е избришан.', 'success');
      await refresh();
    } catch (err) {
      showSnackbar(errorMessage(err, 'Текстот не можеше да се избрише.'), 'error');
    } finally {
      setBusyId(null);
    }
  }, [refresh, showSnackbar]);

  const onAnalyze = useCallback(async (id: number) => {
    setBusyId(id);
    try {
      await resourceApi.analyze(String(id));
      showSnackbar('Анализата е завршена.', 'success');
      await refresh();
    } catch (err) {
      showSnackbar(errorMessage(err, 'Текстот не можеше да се анализира.'), 'error');
    } finally {
      setBusyId(null);
    }
  }, [refresh, showSnackbar]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { resources, loading, busyId, onDelete, onAnalyze, refresh };
};

export default useResources;
