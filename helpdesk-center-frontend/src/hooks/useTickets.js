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
  assignTicket,
  rerouteTicket,
  previewTicket,
  getAiLog,
  getDeptQueue,
  getRiskQueue,
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

/**
 * Returns active (OPEN / IN_PROGRESS) tickets belonging to a peer agent.
 * Derived from the department archive so no new backend endpoint is needed.
 * Used by agents viewing a teammate's workspace.
 */
export function usePeerQueue(peerId) {
  const { data: archive = [], ...rest } = useArchive();
  const tickets = peerId != null
    ? archive.filter(t =>
        t.assignee?.id != null &&
        String(t.assignee.id) === String(peerId) &&
        ['OPEN', 'IN_PROGRESS', 'PENDING_EMPLOYEE'].includes(t.status?.toUpperCase())
      )
    : [];
  return { data: tickets, ...rest };
}

/**
 * Returns active tickets for a specific agent, derived from the dept-queue cache.
 * Used by managers inspecting an agent's workspace — no extra network call.
 */
export function useAgentQueue(agentId) {
  const { data: deptQueue = [], ...rest } = useDeptQueue();
  const tickets = agentId != null
    ? deptQueue.filter(t =>
        t.assignee?.id != null &&
        String(t.assignee.id) === String(agentId) &&
        ['OPEN', 'IN_PROGRESS', 'PENDING_EMPLOYEE'].includes(t.status?.toUpperCase())
      )
    : [];
  return { data: tickets, ...rest };
}

/**
 * All active (non-resolved, non-closed) tickets in the manager's department.
 * Polls every 30 s to keep the queue live.
 */
export function useDeptQueue() {
  return useQuery({
    queryKey: ['tickets', 'dept-queue'],
    queryFn: () => getDeptQueue().then(r => r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Risk queue: active tickets that are breached or within 60 min of breach.
 * Polls every 60 s to keep countdowns accurate.
 */
export function useRiskQueue() {
  return useQuery({
    queryKey: ['tickets', 'risk-queue'],
    queryFn: () => getRiskQueue().then(r => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Reassign a ticket to a different agent. Manager-only.
 * Invalidates dept-queue and the individual ticket cache on success.
 */
export function useReassignTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId }) => assignTicket(id, agentId).then(r => r.data),
    onSuccess: (_updated, { id }) => {
      qc.invalidateQueries({ queryKey: ['tickets', 'dept-queue'] });
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
