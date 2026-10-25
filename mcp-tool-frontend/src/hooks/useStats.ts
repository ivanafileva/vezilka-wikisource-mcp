import { useCallback, useEffect, useState } from 'react';
import statsApi from '../api/statsApi.ts';
import type { CorpusStats } from '../api/types/stats.ts';
import { errorMessage } from '../api/errorMessage.ts';

/**
 * Loads the corpus statistics (GET /api/stats — the same data the
 * `corpus_stats` MCP tool returns) for the home dashboard.
 */
const useStats = (enabled: boolean = true) => {
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await statsApi.get();
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Статистиката не можеше да се вчита.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  return { stats, loading, error, refresh };
};

export default useStats;
