import { useMutation } from '@tanstack/react-query';
import { startDownload, downloadAndSaveMedia } from '../services/api';
import { DownloadJobResponse } from '../types';

export function useStartDownloadMutation() {
  return useMutation<DownloadJobResponse, Error, { id: string; format_type: 'video' | 'audio' | 'subtitle'; quality: string }>({
    mutationFn: ({ id, format_type, quality }) => startDownload(id, format_type, quality),
  });
}

export function useDownloadAndSaveMediaMutation() {
  return useMutation<string, Error, { fileUrl: string; suggestedFilename?: string }>({
    mutationFn: ({ fileUrl, suggestedFilename }) => downloadAndSaveMedia(fileUrl, suggestedFilename),
  });
}
