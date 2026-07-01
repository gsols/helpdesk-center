const PRIORITY_MAP = {
  critical: {
    label: 'Critical',
    color:  '#b91c1c',
    bg:     '#fef2f2',
    border: '#fecaca',
  },
  high: {
    label: 'High',
    color:  '#c2410c',
    bg:     '#fff7ed',
    border: '#fed7aa',
  },
  medium: {
    label: 'Medium',
    color:  '#b45309',
    bg:     '#fffbeb',
    border: '#fde68a',
  },
  low: {
    label: 'Low',
    color:  '#15803d',
    bg:     '#f0fdf4',
    border: '#bbf7d0',
  },
};

export default function PriorityBadge({ value }) {
  const p = PRIORITY_MAP[value] ?? { label: value ?? '—', color: '#57606a', bg: '#f3f4f6', border: '#e5e7eb' };
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      padding:       '2px 8px',
      borderRadius:  999,
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '0.02em',
      color:         p.color,
      background:    p.bg,
      border:        `1px solid ${p.border}`,
      whiteSpace:    'nowrap',
    }}>
      {p.label}
    </span>
  );
}
