const CATEGORY_MAP = {
  hardware: {
    label: 'Hardware',
    color:  '#1d4ed8',
    bg:     '#eff6ff',
    border: '#bfdbfe',
  },
  software: {
    label: 'Software',
    color:  '#7c3aed',
    bg:     '#f5f3ff',
    border: '#ddd6fe',
  },
  hr: {
    label: 'HR',
    color:  '#065f46',
    bg:     '#ecfdf5',
    border: '#a7f3d0',
  },
};

// CategoryBadge — interactive micro-widget, uses rounded-md (ADR-0006 §2)
// NOT rounded-full: circular avatars only. Department badges are interactive pills.
export default function CategoryBadge({ value }) {
  const c = CATEGORY_MAP[value] ?? { label: value ?? '—', color: '#57606a', bg: '#f3f4f6', border: '#e5e7eb' };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold select-none whitespace-nowrap"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}>
      {c.label}
    </span>
  );
}
