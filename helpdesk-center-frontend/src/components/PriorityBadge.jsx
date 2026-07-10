/**
 * PriorityBadge — wireframe style
 * rounded-md, all-caps, text-[10px] font-bold, low-opacity bg + high-opacity text, border
 * CRITICAL=red, HIGH=emerald-green, MEDIUM=amber, LOW=slate
 */
const BADGE_CLS = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM:   'bg-amber-50 text-amber-700 border-amber-200',
  LOW:      'bg-slate-100 text-slate-600 border-slate-200',
};

export default function PriorityBadge({ priority, value }) {
  const raw = priority ?? value;
  const key = raw?.toUpperCase() ?? 'MEDIUM';
  const badgeCls = BADGE_CLS[key] ?? BADGE_CLS.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider select-none whitespace-nowrap ${badgeCls}`}>
      {key}
    </span>
  );
}
