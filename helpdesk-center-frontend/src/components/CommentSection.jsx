/**
 * CommentSection — "employee_ticket_detail_refined_layout" wireframe
 *
 * Layout (top → bottom):
 *  1. INITIAL REPORT card  — ticket.description + ticket.createdAt (pinned, not a comment)
 *  2. System event pill    — "AGENT ASSIGNED TO TICKET" centered pill
 *  3. Conversation thread  — agent LEFT (light bg), employee/reporter RIGHT (dark bg)
 *  4. Reply editor         — toolbar + textarea + SEND REPLY button
 *
 * Agent = sender.role !== 'EMPLOYEE'
 * Employee = sender.role === 'EMPLOYEE'
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMessages, useAddMessage } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { Bold, Italic, Link2, Paperclip, List, Code2, Send, ChevronDown, ChevronUp } from 'lucide-react';

const TOOLBAR_ICONS_PLAIN = [Bold, Italic, Link2];

const fmtTime = (d) => d
  ? new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  : '';

function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/* ── Initial Report card — sticky collapsible curtain ─────────────────────── */
function InitialReportCard({ ticket }) {
  const [open, setOpen] = useState(false);
  if (!ticket) return null;
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      margin: 0,
      borderBottom: '1px solid #e5e7eb',
      background: '#ffffff',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    }}>
      {/* Header — always visible, click to toggle */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px',
          background: '#f8f9ff',
          borderBottom: open ? '1px solid #e5e7eb' : 'none',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#45464d',
          }}>
            Initial Report
          </span>
          <span style={{ fontSize: 10, color: '#76777d' }}>
            {fmtTime(ticket.createdAt)}
          </span>
        </div>
        <span style={{ color: '#9ca3af', display: 'flex' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* Body — curtain reveal */}
      {open && (
        <div style={{
          padding: '12px 14px',
          fontSize: 14, color: '#0b1c30', lineHeight: 1.65,
          borderTop: 'none',
        }}>
          {ticket.description
            ? ticket.description
            : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided.</span>
          }
        </div>
      )}
    </div>
  );
}

/* ── System event pill ────────────────────────────────────────────────────── */
function SystemPill({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
      <span style={{
        background: '#e5eeff',
        border: '1px solid rgba(198,198,205,0.4)',
        borderRadius: 999,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: '#45464d',
        padding: '3px 12px',
      }}>
        {text}
      </span>
    </div>
  );
}

/* ── "Mine" — right-aligned, dark bubble (the current viewer's own messages) */
function OwnMessage({ comment }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, maxWidth: '85%', marginLeft: 'auto' }}>
      {/* Timestamp + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#76777d' }}>{fmtTime(comment.createdAt)}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>
          {comment.sender?.name ?? 'You'}
        </span>
      </div>
      {/* Bubble */}
      <div style={{
        background: '#0b1c30',
        border: '1px solid #0b1c30',
        padding: '12px 14px',
        fontSize: 14, color: '#ffffff', lineHeight: 1.6,
        borderRadius: '8px 0 8px 8px',
      }}>
        {comment.body}
      </div>
    </div>
  );
}

/* ── "Theirs" — left-aligned, light bubble (the other party's messages) */
function TheirMessage({ comment }) {
  const initials = getInitials(comment.sender?.name);
  const isAgentSender = comment.sender?.role && comment.sender.role !== 'EMPLOYEE';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%' }}>
      {/* Avatar + name + timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>
          {comment.sender?.name ?? 'User'}
        </span>
        {/* Verified checkmark only for agent senders */}
        {isAgentSender && (
          <span style={{ fontSize: 13, color: '#3b82f6' }} title="Support Agent">✓</span>
        )}
        <span style={{ fontSize: 11, color: '#76777d' }}>{fmtTime(comment.createdAt)}</span>
      </div>
      {/* Bubble */}
      <div style={{
        background: '#dce9ff',
        border: '1px solid #c6c6cd',
        padding: '12px 14px',
        fontSize: 14, color: '#0b1c30', lineHeight: 1.6,
        borderRadius: '0 8px 8px 8px',
      }}>
        {comment.body}
      </div>
    </div>
  );
}

/* ── Main CommentSection ──────────────────────────────────────────────────── */
export default function CommentSection({ ticketId, ticket, onAttachFile }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const { data: comments = [], isLoading } = useMessages(ticketId);
  const addMessage = useAddMessage();
  const attachInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  /* Scroll to bottom whenever the comment list grows */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  /* ── Drag-to-resize editor panel ───────────────────────────────────────── */
  const MIN_H = 100;
  const MAX_H = 480;
  const [editorHeight, setEditorHeight] = useState(180);
  const dragStartY = useRef(null);
  const dragStartH = useRef(null);

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = editorHeight;

    const onMove = (ev) => {
      const delta = dragStartY.current - ev.clientY;   // drag up → positive delta → taller
      setEditorHeight(Math.min(MAX_H, Math.max(MIN_H, dragStartH.current + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [editorHeight]);

  const isOwn = (c) => c.sender?.id != null && c.sender.id === user?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await addMessage.mutateAsync({ ticketId, message });
      setMessage('');
      // Instant scroll after send — the useEffect above handles the smooth
      // scroll once the query refetch lands and comments.length increases.
      // This immediate call covers the edge case where the count doesn't change.
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      alert('Failed to post comment');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#ffffff' }}>

      {/* ── Conversation body — scrollable ─────────────────────────────────── */}
      <div ref={scrollContainerRef} style={{ flex: 1, padding: '0 0 16px 0', overflowY: 'auto', minHeight: 0 }}>

        {/* 1. Initial Report card */}
        <InitialReportCard ticket={ticket} />

        {/* 2 + 3. Rest of thread — padded */}
        <div style={{ padding: '16px 20px 0' }}>
          {ticket?.assignee && (
            <SystemPill text={`${ticket.assignee.name} assigned to ticket`} />
          )}

          {isLoading ? (
            <p style={{ fontSize: 13, color: '#76777d' }}>Loading…</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 13, color: '#76777d', textAlign: 'center', padding: '8px 0' }}>
              No replies yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.map((c) =>
                isOwn(c)
                  ? <OwnMessage   key={c.id} comment={c} />
                  : <TheirMessage key={c.id} comment={c} />
              )}
            </div>
          )}
          {/* Scroll anchor — scrollIntoView() targets this after each new message */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Reply editor — resizable via top drag handle ──────────────────── */}
      <div style={{ height: editorHeight, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#f8f9ff' }}>

        {/* Drag handle strip — cursor: ns-resize, drag up to grow */}
        <div
          onMouseDown={onDragStart}
          style={{
            height: 6, flexShrink: 0,
            background: '#f1f5f9',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            cursor: 'ns-resize',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1' }} />
            ))}
          </div>
        </div>

        {/* Editor inner */}
        <div style={{ flex: 1, padding: '0 16px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ border: '1px solid #e5e7eb', background: '#ffffff', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Hidden file input for Paperclip button */}
            <input
              ref={attachInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => { if (onAttachFile) onAttachFile(e.target.files); e.target.value = ''; }}
            />

            {/* Textarea + toolbar + submit — single form so submit button works */}
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply here..."
                style={{
                  flex: 1, width: '100%', border: 'none', outline: 'none',
                  fontSize: 14, color: '#0b1c30',
                  padding: '12px 14px', resize: 'none',
                  background: '#ffffff', boxSizing: 'border-box',
                  fontFamily: 'inherit', minHeight: 0,
                }}
              />

              {/* Toolbar — now also contains the Send button */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
                padding: '4px 6px',
                borderTop: '1px solid #e5e7eb',
                background: '#f8f9ff',
              }}>
                {TOOLBAR_ICONS_PLAIN.map((Icon, i) => (
                  <button key={i} type="button" style={toolbarBtnStyle}><Icon size={14} /></button>
                ))}
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  title="Attach file"
                  style={toolbarBtnStyle}
                >
                  <Paperclip size={14} />
                </button>
                <div style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 4px' }} />
                {[List, Code2].map((Icon, i) => (
                  <button key={i} type="button" style={toolbarBtnStyle}><Icon size={14} /></button>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#76777d', whiteSpace: 'nowrap' }}>
                  Replying as <span style={{ color: '#0b1c30' }}>{user?.name ?? 'You'}</span>
                </div>
                <button
                  type="submit"
                  disabled={addMessage.isPending || !message.trim()}
                  style={{
                    marginLeft: 8,
                    background: addMessage.isPending || !message.trim() ? '#94a3b8' : '#0b1c30',
                    color: '#ffffff', border: 'none',
                    padding: '5px 14px',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: addMessage.isPending || !message.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    borderRadius: 0, transition: 'background 150ms', flexShrink: 0,
                  }}
                >
                  {addMessage.isPending ? 'Sending…' : 'Send'}
                  <Send size={11} />
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Style constants ──────────────────────────────────────────────────────── */
const toolbarBtnStyle = {
  background: 'transparent', border: 'none',
  color: '#45464d', cursor: 'pointer',
  padding: '4px 5px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 3,
};
