import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, addComment } from '../api/commentsApi';

export function useMessages(ticketId) {
  return useQuery({
    queryKey: ['messages', ticketId],
    queryFn: () => getComments(ticketId).then(r => r.data),
    enabled: !!ticketId,
    refetchInterval: 5000,          // poll every 5 s — new replies appear without refresh
    refetchIntervalInBackground: false, // pause when tab is hidden
  });
}

export function useAddMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }) => addComment(ticketId, message),
    onSuccess: (_data, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ['messages', ticketId] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
