/**
 * StatCard — wireframe metric matrix cell.
 *
 * When used inside a shared border flex container (AdminDashboard overview row),
 * it renders as a flex-1 cell with a right-border divider, except the last cell.
 *
 * Props:
 *   label   — string  — all-caps label
 *   count   — number  — large display number
 *   icon    — Lucide icon component (optional, rendered as muted accent)
 *   accent  — 'default' | 'amber' | 'emerald' — trend color for the value
 *   last    — bool    — if true, suppress right border (last in row)
 */
export default function StatCard({ label, count, icon: Icon, accent = 'default', last = false }) {
  const valueColor =
    accent === 'amber'   ? 'text-amber-600' :
    accent === 'emerald' ? 'text-emerald-600' :
    'text-[#0b1c30]';

  return (
    <div
      className={[
        'flex-1 p-6 flex flex-col justify-between bg-white',
        last ? '' : 'border-r border-[#c6c6cd]',
      ].join(' ')}
    >
      <p className="text-[11px] font-bold tracking-widest text-[#45464d] uppercase mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-3 mt-1">
        <span
          className={['font-["Hanken_Grotesk"] text-[24px] font-bold leading-8 tracking-tight', valueColor].join(' ')}
        >
          {count ?? 0}
        </span>
        {Icon && (
          <Icon size={14} className="text-[#c6c6cd] mb-0.5" />
        )}
      </div>
    </div>
  );
}
