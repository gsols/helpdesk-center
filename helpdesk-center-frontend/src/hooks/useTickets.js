import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTickets,
  getTicket,
  createTicket,
  updateStatus,
  getMyQueue,
  getDepartmentPool,
  getDepartmentArchive,
  getTriageQueue,
  assignToMe,
  rerouteTicket,
  previewTicket,
} from '../api/ticketsApi';

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: () => getTickets().then(r => r.data),
  });
}

export function useTicket(id) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useMyQueue() {
  return useQuery({
    queryKey: ['tickets', 'my-queue'],
    queryFn: () => getMyQueue().then(r => r.data),
  });
}

export function usePool() {
  return useQuery({
    queryKey: ['tickets', 'pool'],
    queryFn: () => getDepartmentPool().then(r => r.data),
  });
}

export function useArchive() {
  return useQuery({
    queryKey: ['tickets', 'archive'],
    queryFn: () => getDepartmentArchive().then(r => r.data),
  });
}

export function useTriageQueue() {
  return useQuery({
    queryKey: ['tickets', 'triage'],
    queryFn: () => getTriageQueue().then(r => r.data),
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateStatus(id, status),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useAssignToMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => assignToMe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets', 'pool'] });
      qc.invalidateQueries({ queryKey: ['tickets', 'my-queue'] });
    },
  });
}

export function useRerouteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetDepartmentId }) => rerouteTicket(id, targetDepartmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}

export function usePreviewTicket() {
  return useMutation({
    mutationFn: (data) => previewTicket(data).then(r => r.data),
  });
}
