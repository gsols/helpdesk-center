/**
 * SlaProgressBar
 *
 * Renders a thin progress bar tracking SLA time-to-resolution.
 * Design-system rules (frontend-design-system.md §2C):
 *   - Height: `h-1.5` (thin tracker bar)
 *   - Color transitions: blue → amber → red (below 25% remaining)
 *   - Below 25%: animate pulse/flash
 *   - PENDING_EMPLOYEE: bar pauses, italic amber caption shown
 *
 * Props:
 *   createdAt  — ISO string, ticket creation timestamp
 *   dueAt      — ISO string, SLA due timestamp (null = no SLA)
 *   status     — ticket status string (used to detect PENDING_EMPLOYEE)
 */
import { useMemo } from 'react';

export default function SlaProgressBar({ createdAt, dueAt, status }) {
  const isPending = status?.toUpperCase() === 'PENDING_EMPLOYEE';
  const isClosed  = ['RESOLVED', 'CLOSED'].includes(status?.toUpperCase());

  const { pct, colorCls, isBreaching } = useMemo(() => {
    if (!createdAt || !dueAt) return { pct: 0, colorCls: 'bg-slate-200', isBreaching: false };

    const now     = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const due     = new Date(dueAt).getTime();
    const total   = due - created;
    const elapsed = now - created;

    if (total <= 0) return { pct: 100, colorCls: 'bg-red-500', isBreaching: true };

    const rawPct      = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const remaining   = 100 - rawPct;
    const isBreaching = remaining < 25;

    let colorCls;
    if (isClosed)       colorCls = 'bg-slate-300';
    else if (rawPct >= 100) colorCls = 'bg-red-500';
    else if (remaining < 25) colorCls = 'bg-red-500';
    else if (remaining < 50) colorCls = 'bg-amber-400';
    else                     colorCls = 'bg-blue-500';

    return { pct: rawPct, colorCls, isBreaching };
  }, [createdAt, dueAt, isClosed]);

  if (!dueAt) return null;

  return (
    <div className="w-full">
      {/* Track — structural container, rounded-none */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden">
        {/* Fill bar */}
        <div
          className={[
            'h-full transition-all duration-300',
            colorCls,
            isBreaching && !isPending && !isClosed ? 'animate-pulse' : '',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* PENDING_EMPLOYEE pause caption */}
      {isPending && (
        <p className="text-[11px] italic text-amber-600 dark:text-amber-400 mt-0.5">
          SLA paused — awaiting employee response
        </p>
      )}
    </div>
  );
}
