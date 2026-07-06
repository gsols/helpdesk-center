import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserPlus } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';

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
        flex items-center gap-3.5 px-5 py-3 border-b border-gray-100 cursor-pointer flex-wrap
        transition-colors duration-100
        border-l-[3px]
        ${isSelected
          ? 'bg-blue-50 border-l-blue-700'
          : 'bg-white border-l-transparent hover:bg-blue-50 hover:border-l-blue-400'
        }
      `}
    >
      {/* Left: ID + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
          {showSubmitter && ticket.creator?.name && (
            <span className="text-xs text-gray-500">· {ticket.creator.name}</span>
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
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 hover:bg-blue-100"
            title="Claim ticket"
          >
            <UserPlus size={11} /> Claim
          </button>
        )}
        {onAssign && !showClaim && (
          <button
            onClick={e => { e.stopPropagation(); onAssign(); }}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 hover:bg-blue-100"
            title="Assign to me"
          >
            <UserPlus size={11} /> Assign
          </button>
        )}
        <span className="text-xs text-gray-400 min-w-[76px] text-right">{date}</span>
        <ChevronRight size={14} className={`shrink-0 ${isSelected ? 'text-blue-700' : 'text-gray-300'}`} />
      </div>
    </div>
  );
}
