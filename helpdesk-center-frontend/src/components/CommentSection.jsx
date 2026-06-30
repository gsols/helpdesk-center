import { useEffect, useState } from 'react';
import { getComments, addComment } from '../api/commentsApi';

export default function CommentSection({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch (_) {
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
        Comments {comments.length > 0 && <span style={{ color: '#57606a', fontWeight: 400 }}>({comments.length})</span>}
      </h2>

      {comments.length === 0 && (
        <p style={{ color: '#57606a', fontSize: 13, marginBottom: 12 }}>No comments yet.</p>
      )}

      <div style={{ marginBottom: 16 }}>
        {comments.map(c => (
          <div key={c.id} style={commentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{c.user?.fullName}</span>
              <span style={{ fontSize: 12, color: '#57606a' }}>
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{c.message}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write a comment…"
          rows={3}
          style={textareaStyle}
        />
        <button type="submit" disabled={submitting || !message.trim()} style={btnStyle}>
          {submitting ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}

const cardStyle    = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 };
const commentStyle = { borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 12 };
const textareaStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' };
const btnStyle     = { marginTop: 8, padding: '7px 16px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
