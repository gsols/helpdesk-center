/**
 * SlaProgressBar — wireframe style
 * 4px height (h-1), bg-slate-100, fill: emerald→amber→red by urgency
 * Remaining time label inline (text-[10px] font-bold uppercase)
 */
import { useMemo } from 'react';

function formatRemaining(ms) {
  if (ms <= 0) return 'BREACHED';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export default function SlaProgressBar({ createdAt, dueAt, status, ticket }) {
  // Support both prop styles: individual fields OR ticket object
  createdAt = createdAt ?? ticket?.createdAt;
  dueAt     = dueAt     ?? ticket?.dueAt;
  status    = status    ?? ticket?.status;
  const isPending = status?.toUpperCase() === 'PENDING_EMPLOYEE';
  const isClosed  = ['RESOLVED', 'CLOSED'].includes(status?.toUpperCase());

  const { pct, fillCls, remainingMs } = useMemo(() => {
    if (!createdAt || !dueAt) return { pct: 0, fillCls: 'bg-slate-300', remainingMs: 0 };
    const now     = Date.now();
    const created = new Date(createdAt).getTime();
    const due     = new Date(dueAt).getTime();
    const total   = due - created;
    if (total <= 0) return { pct: 100, fillCls: 'bg-red-500', remainingMs: 0 };
    const elapsed    = now - created;
    const rawPct     = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const remaining  = 100 - rawPct;
    const remainingMs = Math.max(0, due - now);
    let fillCls;
    if (isClosed)            fillCls = 'bg-slate-300';
    else if (rawPct >= 100)  fillCls = 'bg-red-500';
    else if (remaining < 25) fillCls = 'bg-red-500';
    else if (remaining < 50) fillCls = 'bg-amber-500';
    else                     fillCls = 'bg-emerald-500';
    return { pct: rawPct, fillCls, remainingMs };
  }, [createdAt, dueAt, isClosed]);

  if (!dueAt) return null;

  const isBreached = remainingMs === 0 && !isClosed;
  const labelCls = isBreached
    ? 'text-red-600'
    : remainingMs < 3600000
      ? 'text-amber-600'
      : 'text-[#45464d]';

  return (
    <div className="w-full">
      {/* Track — 4px height, slate-100 bg */}
      <div className="flex justify-between items-center mb-0.5">
        {isPending && (
          <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">
            SLA PAUSED
          </span>
        )}
        {!isPending && (
          <span className={`text-[10px] font-bold uppercase tracking-wider ${labelCls}`}>
            {formatRemaining(remainingMs)}
          </span>
        )}
      </div>
      <div className="w-full h-1 bg-slate-100 overflow-hidden" style={{ borderRadius: 0 }}>
        <div
          className={`h-full transition-all duration-300 ${fillCls} ${isBreached ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
