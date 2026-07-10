/**
 * PriorityBadge — rectangular border-box style matching ticket header design
 * CRITICAL=red, HIGH=red (with ! icon), MEDIUM=amber, LOW=slate
 */
const STYLES = {
  CRITICAL: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' },
  HIGH:     { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' },
  MEDIUM:   { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
  LOW:      { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' },
};

const LABEL = {
  CRITICAL: 'CRITICAL',
  HIGH:     'HIGH PRIORITY',
  MEDIUM:   'MEDIUM',
  LOW:      'LOW',
};

export default function PriorityBadge({ priority, value }) {
  const raw = priority ?? value;
  const key = raw?.toUpperCase() ?? 'MEDIUM';
  const style = STYLES[key] ?? STYLES.MEDIUM;
  const label = LABEL[key]  ?? key;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px',
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', userSelect: 'none',
      borderRadius: 3,
      ...style,
    }}>
      {(key === 'HIGH' || key === 'CRITICAL') && (
        <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1 }}>!</span>
      )}
      {label}
    </span>
  );
}
