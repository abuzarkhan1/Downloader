import { useQuery } from '@tanstack/react-query';
import { getDownloadStatus } from '../services/api';
import { DownloadStatusResponse } from '../types';

export function useDownloadStatusQuery(downloadJobId: string | null) {
  return useQuery<DownloadStatusResponse, Error>({
    queryKey: ['downloadStatus', downloadJobId],
    queryFn: () => {
      if (!downloadJobId) throw new Error('No job ID provided');
      return getDownloadStatus(downloadJobId);
    },
    enabled: !!downloadJobId,
    refetchInterval: (query) => {
      // Note: React Query v5 changes refetchInterval signature 
      // It passes the Query object. We get the latest data via query.state.data
      const data = query.state.data as DownloadStatusResponse | undefined;
      if (data && (data.status === 'ready' || data.status === 'failed')) {
        return false;
      }
      return 2000; // Poll every 2s
    },
  });
}
