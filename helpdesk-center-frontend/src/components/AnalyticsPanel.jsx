/**
 * AnalyticsPanel
 *
 * High-density Jira-style ticket analytics view for the Admin Dashboard.
 *
 * Structure (all structural containers use rounded-none per ADR-0006 §1):
 *   1. Metric Banner Row  — two KPI stat cells with sharp edges
 *   2. Control Bar        — search input (rounded-none) + Priority filter dropdown
 *   3. Jira Ticket Table  — borderless outer frame, divide-y row separators
 *
 * Interactive widgets (rounded per ADR-0006 §2):
 *   - Priority filter button trigger
 *   - Floating dropdown panel + row labels + checkboxes
 *   - Trend indicator badges (+12%)
 *   - StatusBadge / PriorityBadge sub-components
 *
 * Color tokens sourced from COLORS in tokens.js.
 */
import { useState, useEffect, useRef } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { COLORS } from '../styles/tokens';

// ── Mock data (replaced by real TanStack Query data in production) ─────────────
const MOCK_TICKETS = [
  { id: 'TCK-1001', subject: 'Unable to login to account',       status: 'OPEN',             agent: 'Sarah Jenkins',   channel: 'Email',     priority: 'HIGH'     },
  { id: 'TCK-1002', subject: 'Payment confirmation not received', status: 'IN_PROGRESS',      agent: 'Alex Rivera',     channel: 'Chat',      priority: 'MEDIUM'   },
  { id: 'TCK-1003', subject: 'App crashes on startup',           status: 'OPEN',             agent: 'Daniel Park',     channel: 'Phone',     priority: 'HIGH'     },
  { id: 'TCK-1004', subject: 'Feature request for dark mode',    status: 'PENDING_EMPLOYEE', agent: 'Fatima Al Zahra', channel: 'Email',     priority: 'LOW'      },
  { id: 'TCK-1005', subject: 'Incorrect billing amount',         status: 'RESOLVED',         agent: 'Lucas Fernandez', channel: 'Web Form',  priority: 'HIGH'     },
  { id: 'TCK-1006', subject: 'Password reset not working',       status: 'OPEN',             agent: 'Anita Wijaya',    channel: 'Live Chat', priority: 'LOW'      },
  { id: 'TCK-1007', subject: 'Order status not updating',        status: 'IN_PROGRESS',      agent: 'Rizky Pratama',   channel: 'Phone',     priority: 'MEDIUM'   },
  { id: 'TCK-1008', subject: 'Cannot upload profile picture',    status: 'OPEN',             agent: 'Jin-Ho Kwon',     channel: 'Web Form',  priority: 'CRITICAL' },
  { id: 'TCK-1009', subject: 'Slow system performance reported', status: 'IN_PROGRESS',      agent: 'Maya Santos',     channel: 'Email',     priority: 'HIGH'     },
  { id: 'TCK-1010', subject: 'Export to CSV returns empty file', status: 'PENDING_EMPLOYEE', agent: 'Eitan Goldberg',  channel: 'Chat',      priority: 'MEDIUM'   },
];

// All available priority tiers for the filter control
const PRIORITY_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/** Dot color for the filter dropdown row indicator */
const FILTER_DOT_CLS = {
  LOW:      'bg-emerald-500',
  MEDIUM:   'bg-amber-500',
  HIGH:     'bg-red-500',
  CRITICAL: 'bg-red-700',
};

// ── Sub-component: Priority Filter Dropdown ───────────────────────────────────

function PriorityFilterDropdown({ selected, onToggle, onClear, onClose }) {
  const panelRef = useRef(null);

  // Close the panel when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const activeCount = PRIORITY_TIERS.filter(t => selected[t]).length;

  return (
    /*
     * Floating dropdown panel — interactive widget, uses `rounded` per ADR-0006 §2.
     * shadow-md gives depth without heavy borders.
     */
    <div
      ref={panelRef}
      className="absolute left-0 top-full mt-1 w-52 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-md"
    >
      {/* Panel header */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Filter by Priority
        </span>
        {activeCount < PRIORITY_TIERS.length && (
          <button
            onClick={() => PRIORITY_TIERS.forEach(t => !selected[t] && onToggle(t))}
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Select all
          </button>
        )}
      </div>

      {/* Tier rows — each row is an interactive label, uses `rounded` hover */}
      <div className="p-1.5">
        {PRIORITY_TIERS.map((tier) => (
          <label
            key={tier}
            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              {/* Color dot indicator */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${FILTER_DOT_CLS[tier]}`} />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 capitalize">
                {tier === 'CRITICAL'
                  ? <span className="uppercase tracking-wide font-bold text-red-700 dark:text-red-300">{tier}</span>
                  : tier.charAt(0) + tier.slice(1).toLowerCase()
                }
              </span>
            </div>
            {/*
             * Checkbox — interactive widget, uses `rounded` per ADR-0006 §2.
             * accent-blue-600 colours the checked state.
             */}
            <input
              type="checkbox"
              checked={!!selected[tier]}
              onChange={() => onToggle(tier)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        ))}
      </div>

      {/* Clear / footer */}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onClear}
          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalyticsPanel() {
  const [searchQuery,          setSearchQuery]          = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedPriorities,   setSelectedPriorities]   = useState(
    Object.fromEntries(PRIORITY_TIERS.map(t => [t, true]))
  );

  const togglePriority = (tier) =>
    setSelectedPriorities(prev => ({ ...prev, [tier]: !prev[tier] }));

  const clearSelection = () =>
    setSelectedPriorities(Object.fromEntries(PRIORITY_TIERS.map(t => [t, false])));

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredTickets = MOCK_TICKETS.filter(ticket => {
    const matchesPriority = selectedPriorities[ticket.priority];
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q
      || ticket.id.toLowerCase().includes(q)
      || ticket.subject.toLowerCase().includes(q)
      || ticket.agent.toLowerCase().includes(q);
    return matchesPriority && matchesSearch;
  });

  const openCount    = MOCK_TICKETS.filter(t => t.status === 'OPEN').length;
  const pendingCount = MOCK_TICKETS.filter(t => t.status === 'PENDING_EMPLOYEE').length;

  const activeFilterCount = PRIORITY_TIERS.filter(t => selectedPriorities[t]).length;
  const isFiltered = activeFilterCount < PRIORITY_TIERS.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    /*
     * Root container — structural grid wrapper, rounded-none per ADR-0006 §1.
     * No outer shadow; relies on parent card context for visual separation.
     */
    <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-none select-none">

      {/* ── 1. Metric Banner Row ─────────────────────────────────────────────
           Structural data cards — rounded-none.
           Trend indicator badges (+12%) are interactive widgets — use `rounded`.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-slate-200 dark:border-slate-800 rounded-none">

        {/* Open Tickets cell */}
        <div className="p-6 border-r border-slate-200 dark:border-slate-800 rounded-none bg-white dark:bg-slate-900">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Open Tickets
          </span>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-50">
              {openCount}
            </span>
            {/* Trend indicator badge — interactive widget, uses `rounded` */}
            <span className="inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              ↑ +12% from yesterday
            </span>
          </div>
        </div>

        {/* Pending Response cell */}
        <div className="p-6 rounded-none bg-white dark:bg-slate-900">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Pending Response
          </span>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-50">
              {pendingCount}
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Needs attention
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Control Bar ───────────────────────────────────────────────────
           Structural bar — rounded-none container.
           Search input — form field, rounded-none.
           Priority button & dropdown — interactive widgets, rounded.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 rounded-none">

        {/* Search — form field, rounded-none per design-system §3 */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search ticket ID, agent, subject…"
          className="flex-1 min-w-[220px] h-8 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {/* Priority filter button + dropdown — interactive widget, rounded */}
        <div className="relative">
          <button
            onClick={() => setShowPriorityDropdown(v => !v)}
            className={[
              'h-8 px-3 text-xs font-medium flex items-center gap-1.5 rounded border transition-colors',
              showPriorityDropdown || isFiltered
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
            ].join(' ')}
            aria-haspopup="listbox"
            aria-expanded={showPriorityDropdown}
          >
            <span>Priority</span>
            {isFiltered && (
              // Active filter count badge — interactive widget, rounded-full
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
            {/* Chevron indicator */}
            <svg
              className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${showPriorityDropdown ? 'rotate-180' : ''}`}
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Floating dropdown — rendered via sub-component */}
          {showPriorityDropdown && (
            <PriorityFilterDropdown
              selected={selectedPriorities}
              onToggle={togglePriority}
              onClear={clearSelection}
              onClose={() => setShowPriorityDropdown(false)}
            />
          )}
        </div>

        {/* Active filter summary */}
        {isFiltered && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Showing {filteredTickets.length} of {MOCK_TICKETS.length} tickets
          </span>
        )}
      </div>

      {/* ── 3. Jira-Style Ticket Table ───────────────────────────────────────
           Outer wrapper — structural, rounded-none.
           No outer border frame — relies on divide-y row separators.
           Table header — Jira typography from COLORS.tableHeader.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto rounded-none">
        <table className="w-full text-left border-collapse table-fixed min-w-[820px]">

          {/* Table header — structural, rounded-none bg */}
          <thead>
            <tr className={`border-b border-slate-200 dark:border-slate-800 ${COLORS.tableHeader}`}>
              <th className="w-28 px-4 py-2.5 pl-5">Ticket ID</th>
              <th className="px-4 py-2.5">Subject</th>
              <th className="w-40 px-4 py-2.5">Status</th>
              <th className="w-44 px-4 py-2.5">Assigned Agent</th>
              <th className="w-28 px-4 py-2.5">Channel</th>
              <th className="w-32 px-4 py-2.5 pr-5 text-right">Priority</th>
            </tr>
          </thead>

          {/* Table body — divide-y row separators, no outer border */}
          <tbody className={`text-sm ${COLORS.tableDivider}`}>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  No tickets match the current filters.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`cursor-pointer group ${COLORS.tableRowHover}`}
                >
                  {/* Ticket ID — monospace identifier per design-system §2B */}
                  <td className={`px-4 py-3 pl-5 ${COLORS.ticketId} group-hover:underline`}>
                    {ticket.id}
                  </td>

                  {/* Subject */}
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200 truncate max-w-0">
                    <span className="block truncate" title={ticket.subject}>
                      {ticket.subject}
                    </span>
                  </td>

                  {/* Status — StatusBadge interactive widget */}
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>

                  {/* Assigned Agent */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium truncate">
                    {ticket.agent}
                  </td>

                  {/* Channel */}
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                    {ticket.channel}
                  </td>

                  {/* Priority — PriorityBadge interactive widget */}
                  <td className="px-4 py-3 pr-5 text-right">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table footer — ticket count */}
      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 rounded-none">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          {isFiltered ? ` (filtered from ${MOCK_TICKETS.length})` : ' total'}
        </span>
      </div>
    </div>
  );
}
