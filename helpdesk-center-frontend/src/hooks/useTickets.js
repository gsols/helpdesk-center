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
  getAiLog,
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
    queryFn: () => getTicket(id).then(r => {
      console.debug('[useTicket] raw createdAt:', r.data?.createdAt, '| type:', typeof r.data?.createdAt);
      return r.data;
    }),
    enabled: !!id,
    refetchInterval: 5000,          // poll every 5 s — keeps header + activity live
    refetchIntervalInBackground: false, // pause when tab is hidden
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
    mutationFn: ({ id, status }) => updateStatus(id, status).then(r => r.data),
    onMutate: ({ id, status }) => {
      // Snapshot for rollback
      const previousTicket  = qc.getQueryData(['ticket', id]);
      const previousMyQueue = qc.getQueryData(['tickets', 'my-queue']);
      const previousPool    = qc.getQueryData(['tickets', 'pool']);
      const previousArchive = qc.getQueryData(['tickets', 'archive']);
      const previousAll     = qc.getQueryData(['tickets']);

      // Write optimistic status to every cache immediately (synchronous — no await)
      const patch = (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(t => String(t.id) === String(id) ? { ...t, status } : t);
        return { ...old, status };
      };
      qc.setQueryData(['ticket', id],          patch);
      qc.setQueryData(['tickets', 'my-queue'], patch);
      qc.setQueryData(['tickets', 'pool'],     patch);
      qc.setQueryData(['tickets', 'archive'],  patch);
      qc.setQueryData(['tickets'],             patch);

      return { previousTicket, previousMyQueue, previousPool, previousArchive, previousAll, id };
    },
    onSuccess: (serverTicket, { id }) => {
      // Commit the real server response — no extra refetch needed
      const commit = (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(t => String(t.id) === String(id) ? { ...t, status: serverTicket.status } : t);
        return { ...old, status: serverTicket.status };
      };
      qc.setQueryData(['ticket', id],          commit);
      qc.setQueryData(['tickets', 'my-queue'], commit);
      qc.setQueryData(['tickets', 'pool'],     commit);
      qc.setQueryData(['tickets', 'archive'],  commit);
      qc.setQueryData(['tickets'],             commit);
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      qc.setQueryData(['ticket', context.id],  context.previousTicket);
      qc.setQueryData(['tickets', 'my-queue'], context.previousMyQueue);
      qc.setQueryData(['tickets', 'pool'],     context.previousPool);
      qc.setQueryData(['tickets', 'archive'],  context.previousArchive);
      qc.setQueryData(['tickets'],             context.previousAll);
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

export function useAiLog(ticketId) {
  return useQuery({
    queryKey: ['ticket', ticketId, 'ai-log'],
    queryFn: () => getAiLog(ticketId).then(r => r.status === 204 ? null : r.data),
    enabled: !!ticketId,
  });
}
