const STATUS_MAP = {
  open: {
    label: 'Open',
    color:  '#1d4ed8',
    bg:     '#eff6ff',
    border: '#bfdbfe',
  },
  in_progress: {
    label: 'In Progress',
    color:  '#7c3aed',
    bg:     '#f5f3ff',
    border: '#ddd6fe',
  },
  resolved: {
    label: 'Resolved',
    color:  '#15803d',
    bg:     '#f0fdf4',
    border: '#bbf7d0',
  },
};

export default function StatusBadge({ value }) {
  const s = STATUS_MAP[value] ?? { label: value ?? '—', color: '#57606a', bg: '#f3f4f6', border: '#e5e7eb' };
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      padding:       '2px 8px',
      borderRadius:  999,
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '0.02em',
      color:         s.color,
      background:    s.bg,
      border:        `1px solid ${s.border}`,
      whiteSpace:    'nowrap',
    }}>
      {s.label}
    </span>
  );
}
