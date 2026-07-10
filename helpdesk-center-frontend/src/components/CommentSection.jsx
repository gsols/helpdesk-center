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
import { useState } from 'react';
import { useMessages, useAddMessage } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { Bold, Italic, Link2, Paperclip, List, Code2, Send } from 'lucide-react';

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

/* ── Initial Report card ──────────────────────────────────────────────────── */
function InitialReportCard({ ticket }) {
  if (!ticket) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8f9ff',
        }}>
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
        {/* Card body */}
        <div style={{ padding: '14px 16px', fontSize: 14, color: '#0b1c30', lineHeight: 1.65 }}>
          {ticket.description
            ? ticket.description
            : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided.</span>
          }
        </div>
      </div>
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

/* ── Agent message (LEFT, light blue-gray bg) ─────────────────────────────── */
function AgentMessage({ comment }) {
  const initials = getInitials(comment.sender?.name);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%' }}>
      {/* Name + timestamp */}
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
          {comment.sender?.name ?? 'Agent'}
        </span>
        {/* Verified checkmark */}
        <span style={{ fontSize: 13, color: '#3b82f6' }} title="Support Agent">✓</span>
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

/* ── Employee message (RIGHT, dark bg) ───────────────────────────────────── */
function EmployeeMessage({ comment }) {
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

/* ── Main CommentSection ──────────────────────────────────────────────────── */
export default function CommentSection({ ticketId, ticket }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const { data: comments = [], isLoading } = useMessages(ticketId);
  const addMessage = useAddMessage();

  const isAgent = (c) => c.sender?.role && c.sender.role !== 'EMPLOYEE';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e5e7eb' }}>

      {/* ── Conversation body ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '20px 20px 16px', overflowY: 'auto' }}>

        {/* 1. Initial Report card */}
        <InitialReportCard ticket={ticket} />

        {/* 2. System assignment pill (mocked) */}
        {ticket?.assignee && (
          <SystemPill text={`${ticket.assignee.name} assigned to ticket`} />
        )}

        {/* 3. Conversation thread */}
        {isLoading ? (
          <p style={{ fontSize: 13, color: '#76777d' }}>Loading…</p>
        ) : comments.length === 0 ? (
          <p style={{ fontSize: 13, color: '#76777d', textAlign: 'center', padding: '8px 0' }}>
            No replies yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map((c) =>
              isAgent(c)
                ? <AgentMessage    key={c.id} comment={c} />
                : <EmployeeMessage key={c.id} comment={c} />
            )}
          </div>
        )}
      </div>

      {/* ── Reply editor ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #e5e7eb', background: '#f8f9ff', padding: 16 }}>
        <div style={{
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          overflow: 'hidden',
        }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '6px 8px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f8f9ff',
          }}>
            {[Bold, Italic, Link2, Paperclip].map((Icon, i) => (
              <button key={i} style={toolbarBtnStyle}>
                <Icon size={14} />
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 4px' }} />
            {[List, Code2].map((Icon, i) => (
              <button key={i} style={toolbarBtnStyle}>
                <Icon size={14} />
              </button>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#76777d', whiteSpace: 'nowrap' }}>
              Replying as <span style={{ color: '#0b1c30' }}>{user?.name ?? 'You'}</span>
            </div>
          </div>

          {/* Textarea + submit */}
          <form onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply here..."
              rows={3}
              style={{
                width: '100%', border: 'none', outline: 'none',
                fontSize: 14, color: '#0b1c30',
                padding: '12px 14px', resize: 'none',
                background: '#ffffff', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              padding: '10px 12px',
              borderTop: '1px solid #f1f5f9',
              background: '#ffffff',
            }}>
              <button
                type="submit"
                disabled={addMessage.isPending || !message.trim()}
                style={{
                  background: addMessage.isPending || !message.trim() ? '#94a3b8' : '#0b1c30',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: addMessage.isPending || !message.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderRadius: 0,
                  transition: 'background 150ms',
                }}
              >
                {addMessage.isPending ? 'Sending…' : 'Send'}
                <Send size={12} />
              </button>
            </div>
          </form>
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
