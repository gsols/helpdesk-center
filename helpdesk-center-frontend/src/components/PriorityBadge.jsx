/**
 * PriorityBadge
 *
 * Renders a compact chip for all four priority impact tiers.
 * Tiers: LOW | MEDIUM | HIGH | CRITICAL
 *
 * Design-system rules (ADR-0006 §2):
 *   - Chip wrapper uses `rounded` — interactive micro-widget.
 *   - Leading dot uses `rounded-full` — circular indicator.
 *   - CRITICAL tier activates `uppercase tracking-wider font-bold` and
 *     a high-visibility red background with a pulsing dot.
 *   - Colors sourced from COLORS jewel-tone contracts in tokens.js.
 *
 * Props:
 *   priority — string, one of: LOW | MEDIUM | HIGH | CRITICAL
 */
import React from 'react';

// ── Tailwind class maps keyed by priority ─────────────────────────────────────

/** Full badge class string: background + text + border */
const BADGE_CLS = {
  LOW:
    'bg-emerald-50 text-emerald-700 border-emerald-200 ' +
    'dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',

  MEDIUM:
    'bg-amber-50 text-amber-700 border-amber-200 ' +
    'dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',

  HIGH:
    'bg-red-50 text-red-600 border-red-200 ' +
    'dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',

  CRITICAL:
    'bg-red-100 text-red-700 border-red-300 ' +
    'dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
};

/** Dot fill color keyed by priority */
const DOT_CLS = {
  LOW:      'bg-emerald-500 dark:bg-emerald-400',
  MEDIUM:   'bg-amber-500 dark:bg-amber-400',
  HIGH:     'bg-red-500 dark:bg-red-400',
  CRITICAL: 'bg-red-600 animate-pulse',           // pulsing alert dot
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PriorityBadge({ priority }) {
  const key        = priority?.toUpperCase() ?? 'MEDIUM';
  const badgeCls   = BADGE_CLS[key] ?? BADGE_CLS.MEDIUM;
  const dotCls     = DOT_CLS[key]   ?? DOT_CLS.MEDIUM;
  const isCritical = key === 'CRITICAL';

  return (
    /*
     * `rounded` — interactive micro-widget per ADR-0006 §2.
     * CRITICAL applies `uppercase tracking-wider font-bold` for maximum scan-speed
     * visibility, matching design-system §2C spec.
     */
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium select-none',
        isCritical ? 'uppercase tracking-wider font-bold' : '',
        badgeCls,
      ].join(' ').trim()}
    >
      {/* Leading priority dot — rounded-full circular indicator */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
      {key}
    </span>
  );
}
