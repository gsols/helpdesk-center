import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTicket, updateStatus } from '../api/ticketsApi';
import { getAttachments, downloadUrl } from '../api/attachmentsApi';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['open', 'in_progress', 'resolved'];

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const isAgent = user?.role !== 'employee';

  useEffect(() => {
    getTicket(id)
      .then(r => setTicket(r.data))
      .catch(err => setError('Could not load ticket. ' + (err?.response?.data?.error || '')));
    getAttachments(id).then(r => setAttachments(r.data)).catch(() => {});
  }, [id]);

  const handleStatusChange = async (e) => {
    setUpdating(true);
    try {
      const res = await updateStatus(id, e.target.value);
      setTicket(res.data);
    } catch (_) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error}</div>;
  if (!ticket) return <div style={{ padding: 40, textAlign: 'center', color: '#57606a' }}>Loading…</div>;

  return (
    <div style={pageStyle}>
      <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>#{ticket.id} — {ticket.title}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusBadge value={ticket.category} type="category" />
            <StatusBadge value={ticket.priority} type="priority" />
            <StatusBadge value={ticket.status} type="status" />
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: '#57606a' }}>
          Submitted by <strong>{ticket.createdBy?.username}</strong> · {ticket.email} · {new Date(ticket.createdAt).toLocaleString()}
        </div>

        <p style={{ marginTop: 14, lineHeight: 1.7 }}>{ticket.description}</p>

        {isAgent && (
          <div style={{ marginTop: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Update Status: </label>
            <select value={ticket.status} onChange={handleStatusChange} disabled={updating}
              style={{ marginLeft: 8, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Attachments</h2>
          {attachments.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 13 }}>{a.fileName} <span style={{ color: '#57606a' }}>({(a.fileSize / 1024).toFixed(1)} KB)</span></span>
              <a href={downloadUrl(a.id)} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: '#3b82d4', fontWeight: 600 }}>
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = { maxWidth: 760, margin: '0 auto', padding: '28px 16px' };
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 16 };
const backBtn   = { background: 'none', border: 'none', color: '#3b82d4', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 };
