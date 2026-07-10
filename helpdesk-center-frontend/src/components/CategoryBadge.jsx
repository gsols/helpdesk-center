/**
 * CategoryBadge — wireframe style
 * Slate-toned department tag, rounded-md, text-[10px] font-bold
 */
export default function CategoryBadge({ value }) {
  if (!value) return null;
  const label = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider select-none whitespace-nowrap">
      {label}
    </span>
  );
}
