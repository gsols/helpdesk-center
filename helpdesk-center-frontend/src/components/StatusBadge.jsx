/**
 * StatusBadge
 *
 * Renders a compact pill for every ticket lifecycle state.
 * Statuses: OPEN | IN_PROGRESS | PENDING_EMPLOYEE | RESOLVED | CLOSED
 *
 * Design-system rules (ADR-0006 §2):
 *   - Pill wrapper uses `rounded` — interactive micro-widget.
 *   - Leading dot uses `rounded-full` — circular indicator.
 *   - Colors sourced from COLORS jewel-tone contracts in tokens.js.
 *
 * Props:
 *   status  — string, one of the five TicketStatus enum values
 *             Accepts both the raw API value (e.g. "IN_PROGRESS") and a display
 *             value with spaces (normalised internally).
 */
// ── Tailwind class maps keyed by normalised status string ─────────────────────

/** Full badge class string: background + text + border */
const BADGE_CLS = {
  OPEN:
    'bg-emerald-50 text-emerald-700 border-emerald-200 ' +
    'dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',

  IN_PROGRESS:
    'bg-blue-50 text-blue-700 border-blue-200 ' +
    'dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',

  PENDING_EMPLOYEE:
    'bg-amber-50 text-amber-700 border-amber-200 ' +
    'dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',

  RESOLVED:
    'bg-slate-100 text-slate-700 border-slate-200 ' +
    'dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',

  CLOSED:
    'bg-neutral-200 text-neutral-500 border-neutral-300 ' +
    'dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-800',
};

/** Dot fill color keyed by status */
const DOT_CLS = {
  OPEN:             'bg-emerald-500 dark:bg-emerald-400',
  IN_PROGRESS:      'bg-blue-500 dark:bg-blue-400',
  PENDING_EMPLOYEE: 'bg-amber-500 dark:bg-amber-400',
  RESOLVED:         'bg-slate-400 dark:bg-slate-500',
  CLOSED:           'bg-neutral-400 dark:bg-neutral-500',
};

/** Human-readable labels (replaces underscores, title-cases) */
const LABEL = {
  OPEN:             'Open',
  IN_PROGRESS:      'In Progress',
  PENDING_EMPLOYEE: 'Pending Employee',
  RESOLVED:         'Resolved',
  CLOSED:           'Closed',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StatusBadge({ status }) {
  // Normalise: strip spaces, uppercase — accepts both "IN_PROGRESS" and "In Progress"
  const key = status?.replace(/\s+/g, '_').toUpperCase() ?? 'OPEN';
  const badgeCls = BADGE_CLS[key] ?? BADGE_CLS.OPEN;
  const dotCls   = DOT_CLS[key]   ?? DOT_CLS.OPEN;
  const label    = LABEL[key]     ?? key;

  return (
    /*
     * `rounded` — interactive micro-widget per ADR-0006 §2.
     * `border`  — faint boundary per design-system §1B.
     */
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-semibold select-none ${badgeCls}`}
    >
      {/* Leading status dot — rounded-full circular indicator */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
      {label}
    </span>
  );
}
