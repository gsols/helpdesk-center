import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 10,
        cursor: 'pointer',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>#{ticket.id} — {ticket.title}</div>
        <div style={{ fontSize: 13, color: '#57606a' }}>{ticket.email} · {new Date(ticket.createdAt).toLocaleDateString()}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <StatusBadge value={ticket.category} type="category" />
        <StatusBadge value={ticket.priority} type="priority" />
        <StatusBadge value={ticket.status} type="status" />
      </div>
    </div>
  );
}
