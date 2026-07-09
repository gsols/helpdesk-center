/**
 * StatusBadge — wireframe style
 * rounded-md, all-caps, text-[10px] font-bold, low-opacity bg + high-opacity text, border
 * OPEN=emerald, IN_PROGRESS=blue, PENDING_EMPLOYEE=amber, RESOLVED=slate, CLOSED=outlined
 */
const BADGE_CLS = {
  OPEN:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS:      'bg-blue-50 text-blue-700 border-blue-200',
  PENDING_EMPLOYEE: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED:         'bg-slate-100 text-slate-600 border-slate-200',
  CLOSED:           'border border-slate-200 text-slate-400 bg-white',
};

const LABEL = {
  OPEN:             'OPEN',
  IN_PROGRESS:      'IN PROGRESS',
  PENDING_EMPLOYEE: 'PENDING',
  RESOLVED:         'RESOLVED',
  CLOSED:           'CLOSED',
};

export default function StatusBadge({ status, value }) {
  const raw = status ?? value;
  const key = raw?.replace(/\s+/g, '_').toUpperCase() ?? 'OPEN';
  const badgeCls = BADGE_CLS[key] ?? BADGE_CLS.OPEN;
  const label    = LABEL[key]     ?? key;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider select-none whitespace-nowrap ${badgeCls}`}>
      {label}
    </span>
  );
}
