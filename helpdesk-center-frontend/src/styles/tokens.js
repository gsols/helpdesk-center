/**
 * Design tokens — wireframe "Technical Support Enterprise" palette.
 *
 * T       — primitive tokens (used in inline-style components)
 * COLORS  — Tailwind className helpers
 * cardStyle, btnPrimary, btnSecondary, inputStyle — pre-built style objects
 *
 * ADR-0006:
 *   Structural containers  → borderRadius: 0  (rounded-none)
 *   Interactive widgets    → borderRadius: 6  (rounded-md)
 */

// ─────────────────────────────────────────────────────────────────────────────
// T — primitive token map (JS values, used in inline style objects)
// ─────────────────────────────────────────────────────────────────────────────
export const T = {
  // ── Nav rail ───────────────────────────────────────────────────────────────
  navRail:             '#020617',  // slate-950 — nav rail background (DESIGN.md updated)
  navRailBorder:       'transparent',
  navRailText:         'rgba(148,163,184,1)',    // slate-400 — inactive text/icon
  navRailActive:       '#ffffff',                // active text/icon
  navRailActiveBg:     'rgba(255,255,255,0.06)', // active item bg tint
  navRailActiveAccent: '#34d399',                // emerald-400 — left border indicator

  // ── Sidebar dimensions ─────────────────────────────────────────────────────
  sidebarWidthExpanded:  260,   // full labeled sidebar
  sidebarWidthCollapsed: 64,    // icon-only rail
  topBarHeight:          48,    // shell header height

  // ── Surfaces ───────────────────────────────────────────────────────────────
  surface:       '#f8f9ff',  // background / page canvas
  card:          '#ffffff',  // surface-container-lowest
  border:        '#c6c6cd',  // outline-variant — structural dividers
  borderLight:   '#e5eeff',  // surface-container — lighter dividers

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:   '#0b1c30',  // on-surface
  textSecondary: '#45464d',  // on-surface-variant
  textMuted:     '#76777d',  // outline

  // ── Semantic brand ─────────────────────────────────────────────────────────
  accent:      '#3b82f6',  // blue-500 — focus rings, links
  accentLight: '#eff4ff',  // surface-container-low tint

  // ── Semantic status ────────────────────────────────────────────────────────
  success:       '#15803d',
  successBg:     '#f0fdf4',
  successBorder: '#bbf7d0',
  warning:       '#b45309',
  warningBg:     '#fffbeb',
  warningBorder: '#fde68a',
  danger:        '#ba1a1a',
  dangerBg:      '#ffdad6',
  dangerBorder:  '#fca5a5',

  // ── Sidebar typography ─────────────────────────────────────────────────────
  sidebarText:  'rgba(148,163,184,1)',
  sidebarMuted: 'rgba(100,116,139,1)',  // slate-500

  // ── Legacy compat ──────────────────────────────────────────────────────────
  sidebarWidth: 64,  // collapsed default for non-AppShell usage
};

// ─────────────────────────────────────────────────────────────────────────────
// COLORS — Tailwind class token map
// ─────────────────────────────────────────────────────────────────────────────
export const COLORS = {
  canvas:  { light: 'bg-white' },
  surface: { light: 'bg-[#f8f9ff]' },
  divider: { light: 'border-[#c6c6cd]' },

  textPrimary:   { light: 'text-[#0b1c30]' },
  textSecondary: { light: 'text-[#45464d]' },
  textMuted:     { light: 'text-[#76777d]' },

  // ── Status / priority badge Tailwind strings ───────────────────────────────
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot:   'bg-emerald-500',
    text:  'text-emerald-700',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot:   'bg-blue-500',
    text:  'text-blue-700',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot:   'bg-amber-500',
    text:  'text-amber-700',
  },
  red: {
    badge:         'bg-red-50 text-red-700 border-red-200',
    badgeCritical: 'bg-red-100 text-red-700 border-red-300',
    dot:           'bg-red-500',
    dotCritical:   'bg-red-600 animate-pulse',
    text:          'text-red-700',
  },
  slate: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot:   'bg-slate-400',
    text:  'text-slate-500',
  },
  neutral: {
    badge: 'border border-slate-200 text-slate-400 bg-white',
    dot:   'bg-neutral-400',
    text:  'text-slate-400',
  },

  // ── Table tokens ───────────────────────────────────────────────────────────
  tableHeader:   'text-[11px] font-bold tracking-[0.05em] text-[#45464d] uppercase bg-slate-50/80',
  tableRowHover: 'hover:bg-slate-50 transition-colors',
  tableDivider:  'divide-y divide-slate-100',
  ticketId:      'font-mono text-[13px] font-medium text-[#45464d]',
  inputFocus:    'focus:outline-none focus:border-blue-500',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built style objects
// ─────────────────────────────────────────────────────────────────────────────

/** Structural card container — zero radius */
export const cardStyle = {
  background:   '#ffffff',
  border:       '1px solid #c6c6cd',
  borderRadius: 0,
  padding:      20,
};

/** Primary CTA button — rounded-md (6px) per wireframe interactive spec */
export const btnPrimary = {
  height:       36,
  padding:      '0 16px',
  background:   '#0f172a',
  color:        '#ffffff',
  border:       'none',
  borderRadius: 6,
  fontWeight:   700,
  fontSize:     14,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
};

/** Secondary / outline button — rounded-md */
export const btnSecondary = {
  height:       36,
  padding:      '0 16px',
  background:   '#ffffff',
  color:        '#45464d',
  border:       '1px solid #c6c6cd',
  borderRadius: 6,
  fontWeight:   500,
  fontSize:     14,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
};

/** Standard text input — rounded-md */
export const inputStyle = {
  width:        '100%',
  height:       36,
  padding:      '0 12px',
  border:       '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize:     14,
  boxSizing:    'border-box',
  outline:      'none',
  background:   '#ffffff',
  color:        '#0b1c30',
};
