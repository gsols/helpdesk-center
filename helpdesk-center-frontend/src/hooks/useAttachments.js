import { useMutation } from '@tanstack/react-query';
import { uploadAttachment } from '../api/attachmentsApi';

export function useUploadAttachment() {
  return useMutation({
    mutationFn: ({ ticketId, file }) => uploadAttachment(ticketId, file),
  });
}
