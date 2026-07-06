import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSlaRules, createSlaRule, updateSlaRule } from '../api/slaApi';

export function useSlaRules() {
  return useQuery({
    queryKey: ['sla-rules'],
    queryFn: () => getSlaRules().then(r => r.data),
  });
}

export function useUpsertSlaRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule) =>
      rule.id
        ? updateSlaRule(rule.id, rule).then(r => r.data)
        : createSlaRule(rule).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla-rules'] }),
  });
}
