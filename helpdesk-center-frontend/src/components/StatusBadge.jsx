const PRIORITY_COLORS = {
  critical: '#b91c1c',
  high:     '#c2410c',
  medium:   '#b45309',
  low:      '#15803d',
};

const STATUS_COLORS = {
  open:        '#1d4ed8',
  in_progress: '#7c3aed',
  resolved:    '#15803d',
};

export default function StatusBadge({ value, type = 'status' }) {
  const colors = type === 'status' ? STATUS_COLORS : PRIORITY_COLORS;
  const color = colors[value] || '#57606a';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: color + '20',
      color,
      border: `1px solid ${color}40`,
      textTransform: 'capitalize',
    }}>
      {value?.replace('_', ' ')}
    </span>
  );
}
