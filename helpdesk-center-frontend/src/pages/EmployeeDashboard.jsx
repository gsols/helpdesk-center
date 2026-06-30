import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTickets } from '../api/ticketsApi';
import { createTicket } from '../api/ticketsApi';
import { uploadAttachment } from '../api/attachmentsApi';
import TicketCard from '../components/TicketCard';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', email: user?.email || '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    try {
      const res = await createTicket(form);
      const ticket = res.data;
      if (file) {
        await uploadAttachment(ticket.id, file);
      }
      setSuccess(ticket);
      setShowForm(false);
      setForm({ title: '', description: '', email: user?.email || '' });
      setFile(null);
      const updated = await getTickets();
      setTickets(updated.data);
    } catch (err) {
      alert('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>My Tickets</h1>
          <p style={{ color: '#57606a', fontSize: 13 }}>Welcome, {user?.fullName}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
            {showForm ? 'Cancel' : '+ New Ticket'}
          </button>
          <button onClick={logout} style={btnSecondary}>Logout</button>
        </div>
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          ✅ Ticket <strong>#{success.id}</strong> submitted — Category: <strong>{success.category}</strong> · Priority: <strong>{success.priority}</strong>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Submit New Ticket</h2>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          <label style={labelStyle}>Contact Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <label style={labelStyle}>Attachment (optional, max 10 MB)</label>
          <input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.txt" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13 }} />
          <button type="submit" disabled={submitting} style={{ ...btnPrimary, marginTop: 18, width: '100%' }}>
            {submitting ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </form>
      )}

      {tickets.length === 0 && !showForm
        ? <p style={{ color: '#57606a', textAlign: 'center', marginTop: 40 }}>No tickets yet. Submit your first ticket above.</p>
        : tickets.map(t => <TicketCard key={t.id} ticket={t} />)
      }
    </div>
  );
}

const pageStyle    = { maxWidth: 760, margin: '0 auto', padding: '28px 16px' };
const headerStyle  = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 };
const formStyle    = { background: '#f7f8fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 };
const labelStyle   = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 };
const inputStyle   = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const btnPrimary   = { padding: '8px 16px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const btnSecondary = { padding: '8px 16px', background: '#f1f5f9', color: '#1f2328', border: '1px solid #e5e7eb', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
