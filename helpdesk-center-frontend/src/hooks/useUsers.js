import { useQuery } from '@tanstack/react-query';
import { getTeam } from '../api/usersApi';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => getTeam().then(r => r.data),
    staleTime: 30_000,
  });
}
