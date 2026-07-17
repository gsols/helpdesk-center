/**
 * useMessages / useAddMessage
 *
 * Data strategy:
 *  • Initial load + stale-while-revalidate via React Query (HTTP GET)
 *  • Live updates via STOMP WebSocket — new comments arrive in <1 s without polling
 *  • Polling is kept as a 30 s safety-net fallback (not the primary mechanism)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getComments, addComment } from '../api/commentsApi';
import { useTicketSocket } from './useTicketSocket';

export function useMessages(ticketId) {
  const qc = useQueryClient();

  // Called by useTicketSocket whenever a new comment frame arrives
  const handleIncoming = useCallback(
    (payload) => {
      qc.setQueryData(['messages', ticketId], (prev = []) => {
        // Deduplicate: ignore if this id is already in the cache
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, payload];
      });
      // Also keep the ticket list fresh (e.g. updatedAt timestamp in sidebars)
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
    [qc, ticketId]
  );

  // Open the WebSocket for this ticket
  useTicketSocket(ticketId, handleIncoming);

  return useQuery({
    queryKey: ['messages', ticketId],
    queryFn: () => getComments(ticketId).then((r) => r.data),
    enabled: !!ticketId,
    // 30 s polling as a safety-net (WS handles live delivery; poll catches gaps)
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useAddMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }) => addComment(ticketId, message),
    onSuccess: (_data, { ticketId }) => {
      // Optimistic: invalidate so the HTTP response data is also merged
      qc.invalidateQueries({ queryKey: ['messages', ticketId] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
