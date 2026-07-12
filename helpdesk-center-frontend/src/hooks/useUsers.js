import { useQuery } from '@tanstack/react-query';
import { getTeam, getAllAgents } from '../api/usersApi';
import { getDepartments } from '../api/departmentsApi';

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
/** All agents across the whole company. SYS_ADMIN use only. */
export function useAllAgents() {
  return useQuery({
    queryKey: ['all-agents'],
    queryFn: () => getAllAgents().then(r => r.data),
    staleTime: 60_000,
  });
}

/** All departments in the caller's company. */
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => getDepartments().then(r => r.data),
    staleTime: 120_000,
  });
}

export function useAgentById(agentId) {
  const { data: team = [], ...rest } = useTeam();
  const agent = agentId != null
    ? team.find(m => String(m.id) === String(agentId)) ?? null
    : null;
  return { data: agent, ...rest };
}
