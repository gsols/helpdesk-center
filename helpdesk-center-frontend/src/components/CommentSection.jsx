/**
 * CommentSection — wireframe "agent_workspace_panel_actions_support_engine_1"
 *
 * Threaded conversation + rich text reply input.
 * Agent messages: right-aligned, bg-slate-950 dark bubble.
 * Employee messages: left-aligned, bg-slate-50 light bubble.
 * Status system pills: centered, slate-100 rounded-full.
 * Reply input: slate-50/50 bg, format toolbar + textarea + Send button.
 */
import { useState } from 'react';
import { useMessages, useAddMessage } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { Bold, Italic, Link, Paperclip, Send } from 'lucide-react';

function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const fmtTime = (d) => d
  ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
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
    } catch { alert('Failed to post comment'); }
  };

  const isAgent = (c) => c.sender?.role && c.sender.role !== 'EMPLOYEE';

  return (
    <div className="flex flex-col bg-white border border-[#c6c6cd]" style={{ borderRadius: 0 }}>
      {/* Section header */}
      <div className="px-4 py-3 border-b border-[#c6c6cd] bg-slate-50/50 flex items-center gap-2">
        <span className="text-[11px] font-bold text-[#45464d] uppercase tracking-[0.05em]">Conversation Thread</span>
        {comments.length > 0 && (
          <span className="text-[10px] font-bold text-[#45464d] bg-slate-200 px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto" style={{ minHeight: 120 }}>
        {isLoading ? (
          <p className="text-[13px] text-[#76777d]">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-[13px] text-[#76777d]">No messages yet. Start the conversation.</p>
        ) : (
          comments.map(c => {
            const agent = isAgent(c);
            const initials = getInitials(c.sender?.name);

            if (agent) {
              /* Agent message — right-aligned, dark bubble */
              return (
                <div key={c.id} className="flex flex-row-reverse gap-3 max-w-[85%] ml-auto">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: '#131b2e' }}
                  >
                    {initials}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] text-[#45464d]">{fmtTime(c.createdAt)}</span>
                      <span className="text-[14px] font-semibold text-[#0b1c30]">{c.sender?.name ?? 'Agent'}</span>
                    </div>
                    <div
                      className="bg-slate-950 text-white p-3 text-[14px] leading-relaxed"
                      style={{ borderRadius: '12px 0 12px 12px' }}
                    >
                      {c.body}
                    </div>
                  </div>
                </div>
              );
            }

            /* Employee message — left-aligned, light bubble */
            return (
              <div key={c.id} className="flex gap-3 max-w-[85%]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-[#45464d] shrink-0 bg-slate-100"
                >
                  {initials}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold text-[#0b1c30]">{c.sender?.name ?? 'User'}</span>
                    <span className="text-[13px] text-[#45464d]">{fmtTime(c.createdAt)}</span>
                  </div>
                  <div
                    className="bg-slate-50 border border-[#c6c6cd] p-3 text-[14px] text-[#0b1c30] leading-relaxed"
                    style={{ borderRadius: '0 12px 12px 12px' }}
                  >
                    {c.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply input — wireframe rich text footer */}
      <div className="border-t border-[#c6c6cd] bg-slate-50/50">
        <div className="border border-[#c6c6cd] m-4 overflow-hidden bg-white" style={{ borderRadius: 0 }}>
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
            <button className="p-1 hover:bg-slate-200 rounded transition-colors text-[#45464d]"><Bold size={15} /></button>
            <button className="p-1 hover:bg-slate-200 rounded transition-colors text-[#45464d]"><Italic size={15} /></button>
            <button className="p-1 hover:bg-slate-200 rounded transition-colors text-[#45464d]"><Link size={15} /></button>
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <button className="p-1 hover:bg-slate-200 rounded transition-colors text-[#45464d]"><Paperclip size={15} /></button>
            <div className="ml-auto">
              <span className="text-[10px] font-bold uppercase text-[#45464d] tracking-wider">
                Replying as <span className="text-[#0b1c30]">{user?.name ?? 'You'}</span>
              </span>
            </div>
          </div>

          {/* Textarea */}
          <form onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your response…"
              rows={3}
              className="w-full border-none outline-none text-[14px] text-[#0b1c30] p-4 resize-none bg-white"
              style={{ borderRadius: 0 }}
            />

            {/* Footer bar */}
            <div className="flex justify-between items-center p-3 border-t border-slate-100 bg-white">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#45464d]">
                <input type="checkbox" className="rounded border-slate-300 text-slate-900" style={{ accentColor: '#0f172a' }} />
                Internal Note
              </label>
              <button
                type="submit"
                disabled={addMessage.isPending || !message.trim()}
                className="h-9 px-5 bg-slate-950 text-white text-[13px] font-bold flex items-center gap-2 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ borderRadius: 0 }}
              >
                {addMessage.isPending ? 'Sending…' : 'Send Reply'}
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
