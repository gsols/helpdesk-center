/**
 * TicketCard — wireframe "agent_workspace_panel_actions_support_engine_1" style
 *
 * Structure (per wireframe Pane 1 ticket cards):
 *   Top row: JetBrains Mono ticket ID chip (slate-200/50 bg) + priority badge (right)
 *   Middle: title-md font title, truncated
 *   Bottom: avatar circle + submitter name + relative timestamp
 *   Left border: 4px active indicator (blue-500 active, transparent inactive)
 *   Optional SLA bar below (4px, wireframe style)
 */
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SlaProgressBar from './SlaProgressBar';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function TicketCard({
  ticket,
  showSubmitter = false,
  onSelect,
  isSelected = false,
  onAssign,
  showClaim,
  onClaim,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) onSelect(ticket);
    else navigate(`/tickets/${ticket.id}`);
  };

  const initials = getInitials(ticket.creator?.name);
  const timeAgo  = relativeTime(ticket.createdAt);

  return (
    <div
      onClick={handleClick}
      className={[
        'p-4 border-b border-slate-100 cursor-pointer group',
        isSelected
          ? 'bg-slate-50 border-l-4 border-l-blue-500'
          : 'hover:bg-slate-50 transition-colors border-l-4 border-l-transparent',
      ].join(' ')}
    >
      {/* Top row: ID chip + priority badge */}
      <div className="flex justify-between items-start mb-1">
        <span
          className="font-technical-md text-[#45464d] bg-slate-200/50 px-1.5 py-0.5"
          style={{ borderRadius: 2, fontSize: 12 }}
        >
          #{ticket.id}
        </span>
        <PriorityBadge value={ticket.priority} />
      </div>

      {/* Title */}
      <p
        className="text-[#0b1c30] truncate mb-2"
        style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px' }}
      >
        {ticket.title}
      </p>

      {/* Bottom row: avatar + name + time + status + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: '#3f465c', fontSize: 10 }}
          >
            {initials}
          </div>
          {(showSubmitter && ticket.creator?.name) ? (
            <span className="text-[13px] text-[#45464d] truncate">{ticket.creator.name}</span>
          ) : null}
          <StatusBadge value={ticket.status} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Claim / Assign buttons */}
          {showClaim && onClaim && (
            <button
              onClick={e => { e.stopPropagation(); onClaim(); }}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 hover:bg-emerald-100"
            >
              <UserPlus size={10} /> Claim
            </button>
          )}
          {onAssign && !showClaim && (
            <button
              onClick={e => { e.stopPropagation(); onAssign(); }}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-100"
            >
              <UserPlus size={10} /> Assign
            </button>
          )}
          <span className="text-[13px] text-[#45464d]">{timeAgo}</span>
        </div>
      </div>

      {/* SLA bar — below bottom row */}
      {ticket.dueAt && (
        <div className="mt-2">
          <SlaProgressBar
            createdAt={ticket.createdAt}
            dueAt={ticket.dueAt}
            status={ticket.status}
          />
        </div>
      )}
    </div>
  );
}
