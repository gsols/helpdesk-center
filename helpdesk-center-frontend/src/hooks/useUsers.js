import { useQuery } from '@tanstack/react-query';
import { getTeam } from '../api/usersApi';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => getTeam().then(r => r.data),
    staleTime: 30_000,
  });
}

/**
 * Returns the TeamMemberResponse object for a single peer agent by their user ID.
 * Derived from the existing /api/users/team result — no extra network call.
 */
export function useAgentById(agentId) {
  const { data: team = [], ...rest } = useTeam();
  const agent = agentId != null
    ? team.find(m => String(m.id) === String(agentId)) ?? null
    : null;
  return { data: agent, ...rest };
}
