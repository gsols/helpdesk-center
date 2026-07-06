/**
 * Design tokens — single source of truth for the Helpdesk Center color system.
 *
 * Exports:
 *   T       — brand + surface + text + sizing primitives (used by inline-style components)
 *   COLORS  — full light/dark palette token map for Tailwind className construction
 *   cardStyle, btnPrimary, btnSecondary, inputStyle — pre-built style objects
 *
 * ADR-0006 enforcement:
 *   Structural containers  → borderRadius: 0  (rounded-none)
 *   Interactive widgets    → use Tailwind `rounded` or `rounded-full` directly in JSX
 */

// ─────────────────────────────────────────────────────────────────────────────
// T — primitive token map (JS values, used in inline style objects)
// ─────────────────────────────────────────────────────────────────────────────
export const T = {
  // ── Brand blues ────────────────────────────────────────────────────────────
  navy:         '#1e3a5f',   // sidebar bg, primary CTA
  navyDark:     '#152d4a',   // sidebar active / hover
  navyMid:      '#2a4a73',   // sidebar item hover
  accent:       '#2563eb',   // focus rings, links, active indicator
  accentLight:  '#dbeafe',   // badge bg, highlight tints
  accentMid:    '#93c5fd',   // disabled button, soft accent

  // ── Surfaces (slate palette) ───────────────────────────────────────────────
  surface:      '#f8fafc',   // #F8FAFC — page canvas  (slate-50)
  card:         '#ffffff',   // #FFFFFF — card / panel background
  border:       '#e2e8f0',   // #E2E8F0 — borders, dividers  (slate-200)
  borderHover:  '#cbd5e1',   // hovered / focused border  (slate-300)

  // ── Text (slate palette) ───────────────────────────────────────────────────
  textPrimary:  '#0f172a',   // #0F172A — headings, body  (slate-900)
  textSecondary:'#64748b',   // #64748B — labels, meta  (slate-500)
  textMuted:    '#94a3b8',   // placeholders, disabled  (slate-400)

  // ── Sidebar typography ─────────────────────────────────────────────────────
  sidebarText:  '#e2e8f0',   // nav item default text  (slate-200)
  sidebarMuted: '#94a3b8',   // nav item muted / role label  (slate-400)

  // ── Semantic status colors ─────────────────────────────────────────────────
  success:      '#15803d',   // emerald-700
  successBg:    '#f0fdf4',   // emerald-50
  successBorder:'#bbf7d0',   // emerald-200
  warning:      '#b45309',   // amber-700
  warningBg:    '#fffbeb',   // amber-50
  warningBorder:'#fde68a',   // amber-200
  danger:       '#dc2626',   // red-600
  dangerBg:     '#fef2f2',   // red-50
  dangerBorder: '#fecaca',   // red-200

  // ── Component sizing — ADR-0006 ────────────────────────────────────────────
  // Structural containers always use zero radius
  radiusSm:     0,
  radiusMd:     0,
  radiusLg:     0,
  radiusXl:     0,
  // Circular avatars only — keep pill
  radiusPill:   999,

  sidebarWidth: 240,
  topBarHeight: 56,
};

// ─────────────────────────────────────────────────────────────────────────────
// COLORS — full Tailwind-class token map for both light and dark modes
//
// Usage: import { COLORS } from '../styles/tokens';
//        <div className={COLORS.canvas.light}>…</div>
// ─────────────────────────────────────────────────────────────────────────────
export const COLORS = {

  // ── Layout foundations ─────────────────────────────────────────────────────
  canvas: {
    light: 'bg-white',                          // #FFFFFF
    dark:  'dark:bg-slate-950',                 // #0B0F19
  },
  surface: {
    light: 'bg-slate-50/50',                    // #F8FAFC tinted
    dark:  'dark:bg-slate-900',                 // #111827
  },
  divider: {
    light: 'border-slate-200/80',               // #E2E8F0
    dark:  'dark:border-slate-800',             // #1F2937
  },

  // ── Typography hierarchies ─────────────────────────────────────────────────
  textPrimary: {
    light: 'text-slate-900',                    // #0F172A
    dark:  'dark:text-slate-50',                // #F8FAFC
  },
  textSecondary: {
    light: 'text-slate-500',                    // #64748B
    dark:  'dark:text-slate-400',               // #94A3B8
  },
  textMuted: {
    light: 'text-slate-400',
    dark:  'dark:text-slate-500',
  },

  // ── State jewel-tones — badges & priority indicators ───────────────────────
  // Each entry maps to a complete Tailwind class string for use in badge components.

  /** OPEN / LOW priority — Emerald pass */
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    dot:   'bg-emerald-500 dark:bg-emerald-400',
    text:  'text-emerald-700 dark:text-emerald-400',
  },

  /** IN_PROGRESS / MEDIUM priority — Blue state */
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
    dot:   'bg-blue-500 dark:bg-blue-400',
    text:  'text-blue-700 dark:text-blue-400',
  },

  /** PENDING_EMPLOYEE / HIGH priority — Amber state */
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
    dot:   'bg-amber-500 dark:bg-amber-400',
    text:  'text-amber-700 dark:text-amber-400',
  },

  /** CRITICAL priority — Red alarm (high-visibility, uppercase) */
  red: {
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
    badgeCritical: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    dot:   'bg-red-500 dark:bg-red-400',
    dotCritical: 'bg-red-600 animate-pulse',
    text:  'text-red-700 dark:text-red-400',
  },

  /** RESOLVED — neutral slate */
  slate: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    dot:   'bg-slate-400 dark:bg-slate-500',
    text:  'text-slate-500 dark:text-slate-400',
  },

  /** CLOSED — muted neutral */
  neutral: {
    badge: 'bg-neutral-200 text-neutral-500 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-800',
    dot:   'bg-neutral-400 dark:bg-neutral-500',
    text:  'text-neutral-500 dark:text-neutral-400',
  },

  // ── Jira table structural tokens ───────────────────────────────────────────
  tableHeader:  'text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/40',
  tableRowHover:'hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors',
  tableDivider: 'divide-y divide-slate-100 dark:divide-slate-800/60',
  ticketId:     'font-mono text-xs font-semibold text-blue-600 dark:text-blue-400',

  // ── Input / focus tokens ───────────────────────────────────────────────────
  inputFocus: 'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built style objects (inline-style usage only, e.g. AppShell)
// ─────────────────────────────────────────────────────────────────────────────

/** Structural card container — zero radius per ADR-0006 §1 */
export const cardStyle = {
  background:   '#ffffff',
  border:       '1px solid #e2e8f0',
  borderRadius: 0,
  padding:      20,
};

/** Primary CTA button */
export const btnPrimary = {
  height:       36,
  padding:      '0 16px',
  background:   '#1e3a5f',
  color:        '#ffffff',
  border:       'none',
  borderRadius: 0,
  fontWeight:   600,
  fontSize:     13,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
};

/** Secondary / outline button */
export const btnSecondary = {
  height:       36,
  padding:      '0 16px',
  background:   '#ffffff',
  color:        '#64748b',
  border:       '1px solid #e2e8f0',
  borderRadius: 0,
  fontWeight:   500,
  fontSize:     13,
  cursor:       'pointer',
  display:      'inline-flex',
  alignItems:   'center',
  gap:          6,
};

/** Standard text input — zero radius form field */
export const inputStyle = {
  width:        '100%',
  height:       36,
  padding:      '0 12px',
  border:       '1px solid #e2e8f0',
  borderRadius: 0,
  fontSize:     13,
  boxSizing:    'border-box',
  outline:      'none',
  background:   '#ffffff',
  color:        '#0f172a',
};
