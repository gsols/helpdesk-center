import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';

export default function TicketCard({ ticket, showSubmitter = false }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const date = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        alignItems:      'center',
        padding:         '14px 20px',
        borderBottom:    '1px solid #e5e7eb',
        cursor:          'pointer',
        background:      hovered ? '#f0f6ff' : '#ffffff',
        borderLeft:      `3px solid ${hovered ? '#3b82d4' : 'transparent'}`,
        transition:      'background 0.12s, border-left-color 0.12s',
        gap:             16,
        flexWrap:        'wrap',
      }}
    >
      {/* Left: ID + title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>#{ticket.id}</span>
          {showSubmitter && ticket.createdBy?.username && (
            <span style={{ fontSize: 12, color: '#57606a' }}>· {ticket.createdBy.username}</span>
          )}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2328', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ticket.title}
        </span>
      </div>

      {/* Right: badges + date + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <CategoryBadge value={ticket.category} />
        <StatusBadge value={ticket.status} />
        <PriorityBadge value={ticket.priority} />
        <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 80, textAlign: 'right' }}>{date}</span>
        <ChevronRight size={15} color={hovered ? '#3b82d4' : '#9ca3af'} style={{ transition: 'color 0.12s', flexShrink: 0 }} />
      </div>
    </div>
  );
}
