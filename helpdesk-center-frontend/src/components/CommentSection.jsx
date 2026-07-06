import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessages, useAddMessage } from '../hooks/useMessages';

function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  : '';

export default function CommentSection({ ticketId }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const { data: comments = [], isLoading } = useMessages(ticketId);
  const addMessage = useAddMessage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await addMessage.mutateAsync({ ticketId, message });
      setMessage('');
    } catch {
      alert('Failed to post comment');
    }
  };

  const isAgent = (c) => c.sender?.role && c.sender.role !== 'EMPLOYEE';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h3>

      {isLoading ? (
        <p className="text-sm text-gray-400 mb-5">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-5">No comments yet.</p>
      ) : (
        <div className="mb-5 divide-y divide-gray-100">
          {comments.map((c) => {
            const agent = isAgent(c);
            const initials = getInitials(c.sender?.name);
            return (
              <div key={c.id} className="flex gap-3 py-3.5">
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${agent ? 'bg-blue-700' : 'bg-gray-400'}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">
                      {c.sender?.name ?? 'User'}
                    </span>
                    {agent && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                        Agent
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{fmtDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed m-0">{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm resize-y mb-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addMessage.isPending || !message.trim()}
              className="h-9 px-4 text-sm font-semibold text-white bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
            >
              {addMessage.isPending ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
