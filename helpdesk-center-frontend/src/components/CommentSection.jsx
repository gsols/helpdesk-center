import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getComments, addComment } from '../api/commentsApi';

function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function CommentSection({ ticketId }) {
  const { user }   = useAuth();
  const [comments, setComments]   = useState([]);
  const [message,  setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused,  setFocused]    = useState(false);

  useEffect(() => {
    getComments(ticketId).then(r => setComments(r.data)).catch(() => {});
  }, [ticketId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(ticketId, message);
      setComments(prev => [...prev, res.data]);
      setMessage('');
    } catch {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDateTime = (d) => d
    ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  const isAgent = (c) => c.user?.role && c.user.role !== 'employee';

  return (
    <div style={cardSt}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1f2328', marginBottom: 16 }}>
        Comments
        {comments.length > 0 && (
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#57606a', background: '#f3f4f6', padding: '2px 8px', borderRadius: 999 }}>
            {comments.length}
          </span>
        )}
      </h3>

      {/* Thread */}
      {comments.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>No comments yet.</p>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {comments.map((c, i) => {
            const agent    = isAgent(c);
            const initials = getInitials(c.user?.fullName);
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', gap: 12, padding: '14px 0' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: agent ? '#3b82d4' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 700,
                  }}>
                    {initials}
                  </div>
                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>{c.user?.fullName ?? c.user?.username ?? 'User'}</span>
                      {agent && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#3b82d4', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: 4 }}>
                          Agent
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{fmtDateTime(c.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#1f2328', lineHeight: 1.65, margin: 0 }}>{c.message}</p>
                  </div>
                </div>
                {i < comments.length - 1 && <div style={{ borderBottom: '1px solid #e5e7eb' }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            style={{
              width:        '100%',
              padding:      '10px 12px',
              border:       `1px solid ${focused ? '#3b82d4' : '#d1d5db'}`,
              borderRadius: 6,
              fontSize:     13,
              resize:       'vertical',
              boxSizing:    'border-box',
              fontFamily:   'inherit',
              outline:      'none',
              boxShadow:    focused ? '0 0 0 3px rgba(59,130,212,0.15)' : 'none',
              transition:   'border-color 0.15s, box-shadow 0.15s',
              marginBottom: 10,
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              style={{
                height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600,
                color: '#fff',
                background: (submitting || !message.trim()) ? '#93c5fd' : '#3b82d4',
                border: 'none', borderRadius: 6,
                cursor: (submitting || !message.trim()) ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const cardSt = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)' };
