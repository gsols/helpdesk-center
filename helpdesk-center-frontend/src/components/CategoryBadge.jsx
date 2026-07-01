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

export default function CategoryBadge({ value }) {
  const c = CATEGORY_MAP[value] ?? { label: value ?? '—', color: '#57606a', bg: '#f3f4f6', border: '#e5e7eb' };
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      padding:       '2px 8px',
      borderRadius:  999,
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '0.02em',
      color:         c.color,
      background:    c.bg,
      border:        `1px solid ${c.border}`,
      whiteSpace:    'nowrap',
    }}>
      {c.label}
    </span>
  );
}
