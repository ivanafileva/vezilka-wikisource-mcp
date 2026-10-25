import { useCallback, useEffect, useState } from 'react';
import donationApi from '../api/donationApi.ts';
import type { CreateDonationBatchRequest, DonationBatchResponse } from '../api/types/donation.ts';
import { errorMessage } from '../api/errorMessage.ts';
import useSnackbar from './useSnackbar.ts';

/**
 * Drives the donation workflow for the DonationsPage: lists the batches and
 * exposes create/approve/submit, re-fetching after every mutation.
 */
const useDonations = () => {
  const { showSnackbar } = useSnackbar();

  const [donations, setDonations] = useState<DonationBatchResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await donationApi.findAll();
      setDonations(response.data);
    } catch (err) {
      showSnackbar(errorMessage(err, 'Донациите не можеа да се вчитаат.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const onCreate = useCallback(async (data: CreateDonationBatchRequest): Promise<boolean> => {
    try {
      const response = await donationApi.add(data);
      showSnackbar(`Создаден е пакет за донација #${response.data.id}.`, 'success');
      await refresh();
      return true;
    } catch (err) {
      showSnackbar(errorMessage(err, 'Пакетот за донација не можеше да се создаде.'), 'error');
      return false;
    }
  }, [refresh, showSnackbar]);

  const onApprove = useCallback(async (id: number) => {
    setBusyId(id);
    try {
      await donationApi.approve(String(id));
      showSnackbar(`Пакетот #${id} е одобрен.`, 'success');
    } catch (err) {
      showSnackbar(errorMessage(err, 'Пакетот не можеше да се одобри.'), 'error');
    } finally {
      await refresh();
      setBusyId(null);
    }
  }, [refresh, showSnackbar]);

  const onSubmit = useCallback(async (id: number) => {
    setBusyId(id);
    try {
      const response = await donationApi.submit(String(id));
      showSnackbar(`Пакетот #${id} е испратен на Везилка (${response.data.vezilkaReference}).`, 'success');
    } catch (err) {
      showSnackbar(errorMessage(err, 'Пакетот не можеше да се испрати.'), 'error');
    } finally {
      // A failed submission changes the status to FAILED, so always re-fetch.
      await refresh();
      setBusyId(null);
    }
  }, [refresh, showSnackbar]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { donations, loading, busyId, onCreate, onApprove, onSubmit, refresh };
};

export default useDonations;
