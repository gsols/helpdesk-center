/**
 * Design tokens — single source of truth for the Helpdesk Center color system.
 * Import `T` in any component and reference tokens as T.navy, T.accent, etc.
 */
export const T = {
  // ── Brand blues ──────────────────────────────────────────────────────────
  navy:         '#1e3a5f',   // sidebar bg, primary CTA
  navyDark:     '#152d4a',   // sidebar active / hover
  navyMid:      '#2a4a73',   // sidebar item hover
  accent:       '#2563eb',   // focus rings, links, active indicator
  accentLight:  '#dbeafe',   // badge bg, highlight tints
  accentMid:    '#93c5fd',   // disabled button, soft accent

  // ── Surfaces ─────────────────────────────────────────────────────────────
  surface:      '#f8fafc',   // page canvas
  card:         '#ffffff',   // card / panel background
  border:       '#e2e8f0',   // borders, dividers
  borderHover:  '#cbd5e1',   // hovered / focused border

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:  '#0f172a',   // headings, body
  textSecondary:'#64748b',   // labels, meta
  textMuted:    '#94a3b8',   // placeholders, disabled

  // ── Sidebar typography ────────────────────────────────────────────────────
  sidebarText:  '#e2e8f0',   // nav item default text
  sidebarMuted: '#94a3b8',   // nav item muted / role label

  // ── Semantic ─────────────────────────────────────────────────────────────
  success:      '#15803d',
  successBg:    '#f0fdf4',
  successBorder:'#bbf7d0',
  warning:      '#b45309',
  warningBg:    '#fffbeb',
  warningBorder:'#fde68a',
  danger:       '#dc2626',
  dangerBg:     '#fef2f2',
  dangerBorder: '#fecaca',

  // ── Shared component sizing ───────────────────────────────────────────────
  radiusSm:     4,
  radiusMd:     6,
  radiusLg:     8,
  radiusXl:     12,
  radiusPill:   999,

  sidebarWidth: 240,
  topBarHeight: 56,
};

/** Reusable card style object */
export const cardStyle = {
  background:   '#ffffff',
  border:       '1px solid #e2e8f0',
  borderRadius: 8,
  padding:      20,
  boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
};

/** Primary button style */
export const btnPrimary = {
  height:       36,
  padding:      '0 16px',
  background:   '#1e3a5f',
  color:        '#ffffff',
  border:       'none',
  borderRadius: 6,
  fontWeight:   600,
  fontSize:     13,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
};

/** Secondary/outline button style */
export const btnSecondary = {
  height:       36,
  padding:      '0 16px',
  background:   '#ffffff',
  color:        '#64748b',
  border:       '1px solid #e2e8f0',
  borderRadius: 6,
  fontWeight:   500,
  fontSize:     13,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
};

/** Standard text input style */
export const inputStyle = {
  width:        '100%',
  height:       36,
  padding:      '0 12px',
  border:       '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize:     13,
  boxSizing:    'border-box',
  outline:      'none',
  background:   '#ffffff',
  color:        '#0f172a',
};
