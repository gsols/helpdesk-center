import { useQuery } from '@tanstack/react-query';
import { getFrt, getMttr, getAiAccuracy } from '../api/analyticsApi';

export function useFrt() {
  return useQuery({
    queryKey: ['analytics', 'frt'],
    queryFn: () => getFrt().then(r => r.data),
  });
}

export function useMttr() {
  return useQuery({
    queryKey: ['analytics', 'mttr'],
    queryFn: () => getMttr().then(r => r.data),
  });
}

export function useAiAccuracy() {
  return useQuery({
    queryKey: ['analytics', 'ai-accuracy'],
    queryFn: () => getAiAccuracy().then(r => r.data),
  });
}
