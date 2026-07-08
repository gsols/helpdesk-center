import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserPlus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import SlaProgressBar from './SlaProgressBar';

export default function TicketCard({
  ticket,
  showSubmitter = false,
  onSelect,
  isSelected = false,
  onAssign,    // legacy prop (admin assign-to-agent)
  showClaim,   // pool tab: show "Claim" button
  onClaim,     // pool tab: handler
}) {
  const navigate = useNavigate();

  const date = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const handleClick = () => {
    if (onSelect) onSelect(ticket);
    else navigate(`/tickets/${ticket.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-3.5 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/60
        cursor-pointer flex-wrap transition-colors duration-150
        border-l-[3px]
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-700'
          : 'bg-white dark:bg-neutral-900 border-l-transparent hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 hover:border-l-blue-400'
        }
      `}
    >
      {/* Left: ID + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">#{ticket.id}</span>
          {showSubmitter && ticket.creator?.name && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">· {ticket.creator.name}</span>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-800 block overflow-hidden text-ellipsis whitespace-nowrap">
          {ticket.title}
        </span>
      </div>

      {/* Right: badges + actions + date */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        <CategoryBadge value={ticket.department?.name} />
        <StatusBadge value={ticket.status} />
        <PriorityBadge value={ticket.priority} />

        {showClaim && onClaim && (
          <button
            onClick={e => { e.stopPropagation(); onClaim(); }}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 hover:bg-blue-100"
            title="Claim ticket"
          >
            <UserPlus size={11} /> Claim
          </button>
        )}
        {onAssign && !showClaim && (
          <button
            onClick={e => { e.stopPropagation(); onAssign(); }}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 hover:bg-blue-100"
            title="Assign to me"
          >
            <UserPlus size={11} /> Assign
          </button>
        )}
        <span className="text-xs text-gray-400 min-w-[76px] text-right">{date}</span>
        <ChevronRight size={14} className={`shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-300'}`} />
      </div>

      {/* SLA progress bar — spans full width of the row */}
      {ticket.dueAt && (
        <div className="w-full px-5 pb-1.5">
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
