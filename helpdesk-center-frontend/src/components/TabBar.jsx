/**
 * TabBar — wireframe style
 * Small rounded tab buttons in a bg-slate-50/80 row, matching wireframe agent queue tabs
 */
export default function TabBar({ tabs, value, onChange }) {
  return (
    <div className="flex bg-slate-50/80 border-b border-[#c6c6cd] px-2 pt-2 pb-0 gap-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors rounded-t',
            value === tab.id
              ? 'bg-white border border-[#c6c6cd] border-b-0 text-[#0b1c30] shadow-sm'
              : 'text-[#45464d] hover:bg-white/50',
          ].join(' ')}
        >
          {tab.label}
          {tab.count != null && (
            <span className={[
              'text-[9px] px-1 py-0.5 rounded font-bold',
              value === tab.id ? 'bg-slate-200 text-[#0b1c30]' : 'bg-slate-200/60 text-[#45464d]',
            ].join(' ')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
