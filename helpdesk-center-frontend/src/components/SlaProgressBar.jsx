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

export default function SlaProgressBar({ createdAt, dueAt, status, ticket, darkTrack }) {
  // Support both prop styles: individual fields OR ticket object
  createdAt = createdAt ?? ticket?.createdAt;
  dueAt     = dueAt     ?? ticket?.dueAt;
  status    = status    ?? ticket?.status;
  const isPending = status?.toUpperCase() === 'PENDING_EMPLOYEE';
  const isClosed  = ['RESOLVED', 'CLOSED'].includes(status?.toUpperCase());

  const { pct, remainingPct, fillCls, fillHex, remainingMs } = useMemo(() => {
    if (!createdAt || !dueAt) return { pct: 0, remainingPct: 0, fillCls: 'bg-slate-300', fillHex: '#cbd5e1', remainingMs: 0 };
    const now     = Date.now();
    const created = new Date(createdAt).getTime();
    const due     = new Date(dueAt).getTime();
    const total   = due - created;
    if (total <= 0) return { pct: 100, remainingPct: 0, fillCls: 'bg-red-500', fillHex: '#ef4444', remainingMs: 0 };
    const remainingMs  = Math.max(0, due - now);
    const remainingPct = Math.min(100, Math.max(0, (remainingMs / total) * 100));
    const elapsed      = now - created;
    const rawPct       = Math.min(100, Math.max(0, (elapsed / total) * 100));
    let fillCls, fillHex;
    if (isClosed)                { fillCls = 'bg-slate-300';  fillHex = '#cbd5e1'; }
    else if (rawPct >= 100)      { fillCls = 'bg-red-500';    fillHex = '#ef4444'; }
    else if (remainingPct < 25)  { fillCls = 'bg-red-500';    fillHex = '#ef4444'; }
    else if (remainingPct < 50)  { fillCls = 'bg-amber-500';  fillHex = '#f59e0b'; }
    else                         { fillCls = 'bg-blue-500';   fillHex = '#3b82f6'; }
    return { pct: rawPct, remainingPct, fillCls, fillHex, remainingMs };
  }, [createdAt, dueAt, isClosed]);

  const isBreached  = !isClosed && !!dueAt && remainingMs === 0;
  const isAlert     = !isBreached && !isPending && remainingPct < 25;
  const labelCls = isBreached
    ? 'text-red-600'
    : remainingMs < 3600000
      ? 'text-amber-600'
      : 'text-[#45464d]';

  // No SLA configured — render neutral placeholder bar
  if (!dueAt) {
    return (
      <div className="w-full">
        {!darkTrack && (
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              NO SLA SET
            </span>
          </div>
        )}
        <div className="w-full h-1 bg-slate-100 overflow-hidden" style={{ borderRadius: 0 }}>
          <div className="h-full bg-slate-300" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Inline remaining label — hidden when darkTrack (header already shows it) */}
      {!darkTrack && (
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
      )}
      {darkTrack ? (
        <div style={{ width: '100%', height: 5, background: '#e5e7eb', overflow: 'hidden', borderRadius: 0 }}>
          <div
            className={isAlert ? 'animate-pulse' : ''}
            style={{
              width: isBreached ? '0%' : isPending ? `${remainingPct}%` : `${remainingPct}%`,
              height: '100%',
              background: isPending ? '#94a3b8' : fillHex,
              opacity: isPending ? 0.5 : 1,
              transition: 'width 0.3s',
            }}
          />
        </div>
      ) : (
        <div className="w-full h-1 bg-slate-100 overflow-hidden" style={{ borderRadius: 0 }}>
          <div
            className={`h-full transition-all duration-300 ${fillCls} ${isAlert || isBreached ? 'animate-pulse' : ''} ${isPending ? 'opacity-50' : ''}`}
            style={{ width: isBreached ? '0%' : `${remainingPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
