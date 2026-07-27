import { useMutation } from '@tanstack/react-query';
import { analyzeUrl } from '../services/api';
import { AnalyzeResponse, AnalyzeErrorResponse } from '../types';

export function useAnalyzeMutation() {
  return useMutation<AnalyzeResponse, AnalyzeErrorResponse, string>({
    mutationFn: (url: string) => analyzeUrl(url),
  });
}
