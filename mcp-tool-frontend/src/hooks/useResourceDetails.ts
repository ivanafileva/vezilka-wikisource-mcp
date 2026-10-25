import { useCallback, useEffect, useState } from 'react';
import resourceApi from '../api/resourceApi.ts';
import donationApi from '../api/donationApi.ts';
import type { ResourceResponse } from '../api/types/resource.ts';
import type { DonationBatchResponse } from '../api/types/donation.ts';
import { errorMessage } from '../api/errorMessage.ts';
import useSnackbar from './useSnackbar.ts';

/**
 * Loads one resource for the ResourceDetailsPage and exposes the analyze and
 * "add to a donation batch" actions.
 */
const useResourceDetails = (id: string) => {
  const { showSnackbar } = useSnackbar();

  const [resource, setResource] = useState<ResourceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [working, setWorking] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    try {
      const response = await resourceApi.findById(id);
      setResource(response.data);
    } catch (err) {
      showSnackbar(errorMessage(err, 'Текстот не можеше да се вчита.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showSnackbar]);

  const onAnalyze = useCallback(async () => {
    setWorking(true);
    try {
      const response = await resourceApi.analyze(id);
      setResource(response.data);
      showSnackbar('Анализата е завршена.', 'success');
    } catch (err) {
      showSnackbar(errorMessage(err, 'Текстот не можеше да се анализира.'), 'error');
    } finally {
      setWorking(false);
    }
  }, [id, showSnackbar]);

  const onCreateDonation = useCallback(async (): Promise<DonationBatchResponse | null> => {
    setWorking(true);
    try {
      const response = await donationApi.add({ resourceIds: [Number(id)] });
      showSnackbar(`Создаден е пакет за донација #${response.data.id}.`, 'success');
      await refresh();
      return response.data;
    } catch (err) {
      showSnackbar(errorMessage(err, 'Пакетот за донација не можеше да се создаде.'), 'error');
      return null;
    } finally {
      setWorking(false);
    }
  }, [id, refresh, showSnackbar]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  return { resource, loading, working, onAnalyze, onCreateDonation };
};

export default useResourceDetails;
