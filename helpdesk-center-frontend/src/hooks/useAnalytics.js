import { useQuery } from '@tanstack/react-query';
import { getFrt, getMttr, getAiAccuracy, getDeptSummary, getDeptDaily } from '../api/analyticsApi';

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

export function useDeptSummary() {
  return useQuery({
    queryKey: ['analytics', 'dept-summary'],
    queryFn: () => getDeptSummary().then(r => r.data),
    staleTime: 30_000,
  });
}

export function useDeptDaily() {
  return useQuery({
    queryKey: ['analytics', 'dept-daily'],
    queryFn: () => getDeptDaily().then(r => r.data),
    staleTime: 60_000,
  });
}
