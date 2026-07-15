import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDepartments,
  getDepartmentDetail,
  createDepartment,
  deleteDepartment,
  getEligibleAgents,
  addAgent,
  changeManager,
} from '../api/departmentsApi';
import { getAllUsers } from '../api/usersApi';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const deptKeys = {
  all:      ['departments'],
  detail:   (id) => ['departments', id],
  eligible: (id) => ['departments', id, 'eligible-agents'],
  allUsers: ['users', 'all'],
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useDepartments() {
  return useQuery({
    queryKey: deptKeys.all,
    queryFn:  () => getDepartments().then(r => r.data),
  });
}

export function useDepartmentDetail(id) {
  return useQuery({
    queryKey: deptKeys.detail(id),
    queryFn:  () => getDepartmentDetail(id).then(r => r.data),
    enabled:  !!id,
  });
}

export function useEligibleAgents(id) {
  return useQuery({
    queryKey: deptKeys.eligible(id),
    queryFn:  () => getEligibleAgents(id).then(r => r.data),
    enabled:  !!id,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: deptKeys.allUsers,
    queryFn:  () => getAllUsers().then(r => r.data),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createDepartment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deptKeys.all }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deptKeys.all }),
  });
}

export function useAddAgent(deptId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => addAgent(deptId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deptKeys.detail(deptId) });
      qc.invalidateQueries({ queryKey: deptKeys.eligible(deptId) });
    },
  });
}

export function useChangeManager(deptId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => changeManager(deptId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deptKeys.detail(deptId) });
      qc.invalidateQueries({ queryKey: deptKeys.eligible(deptId) });
    },
  });
}
