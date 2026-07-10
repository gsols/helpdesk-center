/**
 * StatusBadge — rectangular border-box style matching ticket header design
 * OPEN=emerald, IN_PROGRESS=blue, PENDING_EMPLOYEE=amber, RESOLVED=slate, CLOSED=outlined
 */
const STYLES = {
  OPEN:             { background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' },
  IN_PROGRESS:      { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' },
  PENDING_EMPLOYEE: { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' },
  RESOLVED:         { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' },
  CLOSED:           { background: '#ffffff', color: '#94a3b8', border: '1px solid #e2e8f0' },
};

const LABEL = {
  OPEN:             'OPEN',
  IN_PROGRESS:      'IN PROGRESS',
  PENDING_EMPLOYEE: 'PENDING',
  RESOLVED:         'RESOLVED',
  CLOSED:           'CLOSED',
};

export default function StatusBadge({ status, value }) {
  const raw = status ?? value;
  const key = raw?.replace(/\s+/g, '_').toUpperCase() ?? 'OPEN';
  const style = STYLES[key] ?? STYLES.OPEN;
  const label = LABEL[key]  ?? key;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px',
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', userSelect: 'none',
      borderRadius: 3,
      ...style,
    }}>
      {label}
    </span>
  );
}
