import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserPlus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import { T } from '../styles/tokens';

export default function TicketCard({ ticket, showSubmitter = false, onSelect, isSelected = false, onAssign }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const date = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const active = isSelected || hovered;

  const handleClick = () => {
    if (onSelect) onSelect(ticket);
    else navigate(`/tickets/${ticket.id}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        padding:      '13px 20px',
        borderBottom: `1px solid ${T.border}`,
        cursor:       'pointer',
        background:   isSelected ? T.accentLight : hovered ? '#f0f6ff' : '#ffffff',
        borderLeft:   `3px solid ${active ? T.navy : 'transparent'}`,
        transition:   'background 0.12s, border-left-color 0.12s',
        gap:          14,
        flexWrap:     'wrap',
      }}
    >
      {/* Left: ID + title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace' }}>#{ticket.id}</span>
          {showSubmitter && ticket.createdBy?.username && (
            <span style={{ fontSize: 11, color: T.textSecondary }}>· {ticket.createdBy.username}</span>
          )}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ticket.title}
        </span>
      </div>

      {/* Right: badges + assign + date + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, flexWrap: 'wrap' }}>
        <CategoryBadge value={ticket.category} />
        <StatusBadge value={ticket.status} />
        <PriorityBadge value={ticket.priority} />
        {onAssign && (
          <button
            onClick={e => { e.stopPropagation(); onAssign(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: T.navy,
              background: T.accentLight, border: `1px solid #bfdbfe`,
              borderRadius: T.radiusPill, padding: '2px 8px', cursor: 'pointer',
            }}
            title="Assign to me"
          >
            <UserPlus size={11} />Assign to me
          </button>
        )}
        <span style={{ fontSize: 11, color: T.textMuted, minWidth: 76, textAlign: 'right' }}>{date}</span>
        <ChevronRight size={14} color={active ? T.navy : T.textMuted} style={{ transition: 'color 0.12s', flexShrink: 0 }} />
      </div>
    </div>
  );
}
