import { T } from '../styles/tokens';

/**
 * StatCard — displays a metric with label, large count, and colored icon.
 *
 * Props:
 *   label   — string  e.g. "Open Tickets"
 *   count   — number
 *   color   — CSS color string for the accent (icon + count)
 *   bg      — CSS color string for the icon background tint
 *   icon    — Lucide icon component
 */
export default function StatCard({ label, count, color, bg, icon: Icon }) {
  return (
    // Structural card container — rounded-none (ADR-0006 §1)
    <div style={{
      background:   T.card,
      border:       `1px solid ${T.border}`,
      borderRadius: 0,
      padding:      '18px 20px',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'space-between',
      gap:          16,
      flex:         1,
      minWidth:     0,
    }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {label}
        </p>
        <p style={{ fontSize: 32, fontWeight: 700, color: color ?? T.navy, lineHeight: 1 }}>
          {count ?? 0}
        </p>
      </div>
      {Icon && (
        // Icon container is an interactive visual widget — uses rounded (ADR-0006 §2)
        <div className="rounded" style={{
          width:          44,
          height:         44,
          background:     bg ?? T.accentLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}>
          <Icon size={20} color={color ?? T.accent} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
