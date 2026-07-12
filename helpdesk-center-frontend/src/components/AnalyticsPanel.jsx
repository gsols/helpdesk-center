/**
 * AnalyticsPanel — Admin Analytics tab
 *
 * Design language: inline styles, palette #0f172a / #94a3b8 / #e2e8f0,
 * JetBrains Mono for data values, 20px 24px section padding —
 * consistent with ManagerAnalyticsPanel and AdminOverviewPanel.
 *
 * Sections:
 *   1. Executive metric matrix — FRT · MTTR · AI Accuracy (live data)
 *   2. Ticket Volume Heatmap + Top Routing Categories + Live ticket table
 *   3. System Integrity sidebar + Recent Critical Events
 *   4. IBM watsonx.ai Model Optimization dock
 */
import { useState, useEffect, useRef } from 'react';
import { useFrt, useMttr, useAiAccuracy } from '../hooks/useAnalytics';
import { useTickets } from '../hooks/useTickets';
import { useAllAgents, useDepartments } from '../hooks/useUsers';
import StatusBadge            from './StatusBadge';
import PriorityBadge          from './PriorityBadge';
import TicketInspectionDrawer from './TicketInspectionDrawer';

/* ── static fixtures ─────────────────────────────────────────────────────── */
const PRIORITY_TIERS  = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUS_VALUES   = ['OPEN', 'IN_PROGRESS', 'PENDING_EMPLOYEE', 'RESOLVED', 'CLOSED'];
const STATUS_LABELS   = { OPEN: 'Open', IN_PROGRESS: 'In Progress', PENDING_EMPLOYEE: 'Pending', RESOLVED: 'Resolved', CLOSED: 'Closed' };
const STATUS_COLORS   = { OPEN: '#f59e0b', IN_PROGRESS: '#3b82f6', PENDING_EMPLOYEE: '#8b5cf6', RESOLVED: '#22c55e', CLOSED: '#94a3b8' };

const HEATMAP_COLORS = [
  ['#f8fafc','#f1f5f9','#e2e8f0','#cbd5e1','#f1f5f9','#f8fafc','#f1f5f9'],
  ['#f1f5f9','#94a3b8','#64748b','#0f172a','#94a3b8','#f1f5f9','#f1f5f9'],
  ['#e2e8f0','#64748b','#0f172a','#0f172a','#64748b','#e2e8f0','#f1f5f9'],
  ['#f1f5f9','#cbd5e1','#94a3b8','#cbd5e1','#f1f5f9','#f1f5f9','#f8fafc'],
];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIME_BANDS = ['00–06','06–12','12–18','18–24'];

const RETRO_ROWS = [
  { category: 'Account & Authentication', volume: '2,412', rate: 94 },
  { category: 'API Connectivity Issues',  volume: '1,894', rate: 78 },
  { category: 'Billing Discrepancies',    volume: '942',   rate: 89 },
];

const PRIORITY_DOT = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#f87171',
  CRITICAL: '#dc2626',
};

/* ── Priority filter dropdown ────────────────────────────────────────────── */
function PriorityFilterDropdown({ selected, onToggle, onClear, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function cb(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', cb);
    return () => document.removeEventListener('mousedown', cb);
  }, [onClose]);

  const count = PRIORITY_TIERS.filter(t => selected[t]).length;
  return (
    <div ref={ref} style={{
      position: 'absolute', left: 0, top: 'calc(100% + 4px)',
      width: 200, zIndex: 50,
      background: '#fff', border: '1px solid #e2e8f0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>
          Filter by Priority
        </span>
        {count < PRIORITY_TIERS.length && (
          <button
            onClick={() => PRIORITY_TIERS.forEach(t => !selected[t] && onToggle(t))}
            style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Select all
          </button>
        )}
      </div>
      <div style={{ padding: '6px' }}>
        {PRIORITY_TIERS.map(tier => (
          <label key={tier} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 8px', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[tier], display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>
                {tier.charAt(0) + tier.slice(1).toLowerCase()}
              </span>
            </div>
            <input
              type="checkbox"
              checked={!!selected[tier]}
              onChange={() => onToggle(tier)}
              style={{ accentColor: '#0f172a', cursor: 'pointer' }}
            />
          </label>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onClear}
          style={{ fontSize: 11, color: '#64748b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}

/* ── Status filter dropdown ──────────────────────────────────────────────── */
function StatusFilterDropdown({ selected, onToggle, onClear, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function cb(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', cb);
    return () => document.removeEventListener('mousedown', cb);
  }, [onClose]);

  const count = STATUS_VALUES.filter(s => selected[s]).length;
  return (
    <div ref={ref} style={{
      position: 'absolute', left: 0, top: 'calc(100% + 4px)',
      width: 200, zIndex: 50,
      background: '#fff', border: '1px solid #e2e8f0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>
          Filter by Status
        </span>
        {count < STATUS_VALUES.length && (
          <button
            onClick={() => STATUS_VALUES.forEach(s => !selected[s] && onToggle(s))}
            style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Select all
          </button>
        )}
      </div>
      <div style={{ padding: '6px' }}>
        {STATUS_VALUES.map(s => (
          <label key={s} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 8px', cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s], display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{STATUS_LABELS[s]}</span>
            </div>
            <input
              type="checkbox"
              checked={!!selected[s]}
              onChange={() => onToggle(s)}
              style={{ accentColor: '#0f172a', cursor: 'pointer' }}
            />
          </label>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onClear}
          style={{ fontSize: 11, color: '#64748b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          Clear selection
        </button>
      </div>
    </div>
  );
}

/* ── AI Accuracy gauge SVG ───────────────────────────────────────────────── */
function AiGauge({ pct = 0 }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const color = pct >= 0.9 ? '#22c55e' : pct >= 0.7 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg viewBox="0 0 44 44" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 20 20" style={{ width: 16, height: 16, color: '#0f172a' }} fill="currentColor">
          <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
        </svg>
      </div>
    </div>
  );
}

/* ── main ────────────────────────────────────────────────────────────────── */
export default function AnalyticsPanel() {
  const [heatmapRange,         setHeatmapRange]         = useState('7');
  const [searchQuery,          setSearchQuery]          = useState('');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown,   setShowStatusDropdown]   = useState(false);
  const [selectedTicketId,     setSelectedTicketId]     = useState(null);
  const [page,                 setPage]                 = useState(1);
  const [selectedPriorities,   setSelectedPriorities]   = useState(
    Object.fromEntries(PRIORITY_TIERS.map(t => [t, true]))
  );
  const [selectedStatuses,     setSelectedStatuses]     = useState(
    Object.fromEntries(STATUS_VALUES.map(s => [s, true]))
  );

  const { data: frtData }         = useFrt();
  const { data: mttrData }        = useMttr();
  const { data: aiData }          = useAiAccuracy();
  const { data: allTickets = [] } = useTickets();
  const { data: allAgents = [] }  = useAllAgents();
  const { data: departments = [] } = useDepartments();

  const togglePriority    = t => setSelectedPriorities(p => ({ ...p, [t]: !p[t] }));
  const clearPriorities   = () => setSelectedPriorities(Object.fromEntries(PRIORITY_TIERS.map(t => [t, false])));
  const toggleStatus      = s => setSelectedStatuses(p => ({ ...p, [s]: !p[s] }));
  const clearStatuses     = () => setSelectedStatuses(Object.fromEntries(STATUS_VALUES.map(s => [s, false])));

  const activePriorityCount = PRIORITY_TIERS.filter(t => selectedPriorities[t]).length;
  const activeStatusCount   = STATUS_VALUES.filter(s => selectedStatuses[s]).length;
  const isPriorityFiltered  = activePriorityCount < PRIORITY_TIERS.length;
  const isStatusFiltered    = activeStatusCount   < STATUS_VALUES.length;
  const isFiltered          = isPriorityFiltered || isStatusFiltered;

  const PAGE_SIZE = 8;

  const filteredTickets = allTickets.filter(t => {
    const priority = t.priority?.toUpperCase() ?? 'MEDIUM';
    if (!selectedPriorities[priority]) return false;
    const status = t.status?.toUpperCase() ?? 'OPEN';
    if (!selectedStatuses[status]) return false;
    const q = searchQuery.toLowerCase().trim();
    return !q
      || String(t.id).includes(q)
      || (t.title ?? '').toLowerCase().includes(q)
      || (t.assignee?.name ?? '').toLowerCase().includes(q);
  });

  const totalPages   = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const pagedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters/search change

  const frtHours  = frtData?.averageFrtHours  != null ? Number(frtData.averageFrtHours).toFixed(1)   : null;
  const aiPct     = aiData?.accuracyPct       != null ? Number(aiData.accuracyPct)                   : null;
  const aiDisplay = aiPct != null ? `${aiPct.toFixed(1)}%` : '—';

  // MTTR: average across all departments
  const mttrRows  = Array.isArray(mttrData) ? mttrData : [];
  const avgMttr   = mttrRows.length
    ? (mttrRows.reduce((s, r) => s + Number(r.meanTimeToResolutionHours ?? 0), 0) / mttrRows.length).toFixed(1)
    : null;

  // Reset page when search/filter changes
  useEffect(() => { setPage(1); setSelectedTicketId(null); }, [searchQuery, activePriorityCount, activeStatusCount]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── page header ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Admin › Analytics</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Analytics & AI Tuning</h2>
      </div>

      {/* ── 1. Executive Metric Matrix ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0' }}>

        {/* FRT */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={labelStyle}>Avg First Response Time (FRT)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 10px' }}>
            <span style={{ ...bigNumStyle, color: '#0f172a' }}>
              {frtHours ?? '—'}
            </span>
            {frtHours && <span style={{ fontSize: 16, color: '#94a3b8' }}>hrs</span>}
            {frtHours && Number(frtHours) <= 2 && (
              <span style={{ ...chipStyle, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                ↓ On Target
              </span>
            )}
          </div>
          <div style={{ height: 4, background: '#e2e8f0', overflow: 'hidden', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: frtHours ? `${Math.min((Number(frtHours) / 8) * 100, 100)}%` : '0%',
              background: frtHours && Number(frtHours) <= 2 ? '#22c55e' : '#f59e0b',
              transition: 'width 400ms ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Target: &lt; 2 hrs</div>
        </div>

        {/* MTTR */}
        <div style={{ background: '#fff', padding: '20px 24px', borderLeft: '1px solid #e2e8f0' }}>
          <div style={labelStyle}>Mean Time to Resolution (MTTR)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 10px' }}>
            <span style={bigNumStyle}>{avgMttr ?? '—'}</span>
            {avgMttr && <span style={{ fontSize: 16, color: '#94a3b8' }}>hrs avg</span>}
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
            {[100, 100, 50, 20, 10, 10].map((w, i) => (
              <div key={i} style={{ height: 16, flex: 1, background: w >= 80 ? '#0f172a' : w >= 40 ? '#64748b' : '#e2e8f0' }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Efficiency Trend: <span style={{ fontWeight: 700, color: '#0f172a' }}>Stable</span>
          </div>
        </div>

        {/* AI Accuracy */}
        <div style={{ background: '#fff', padding: '20px 24px', borderLeft: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>AI Routing Accuracy</div>
            <div style={{ ...bigNumStyle, margin: '8px 0 4px' }}>{aiDisplay}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Goal: 92.0%{' '}
              {aiPct != null && aiPct < 92 && (
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                  (+{(92 - aiPct).toFixed(1)}% target)
                </span>
              )}
            </div>
          </div>
          <AiGauge pct={aiPct != null ? aiPct / 100 : 0} />
        </div>
      </div>

      {/* ── 2. Live Ticket Table — full width ────────────────────────────── */}
      <div style={{ border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', height: 440 }}>

        {/* Table side */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          {/* Control bar — top row: search + filters */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            {/* row 1: search + filter buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, agent, subject…"
                style={{ flex: 1, minWidth: 0, height: 30, padding: '0 10px', fontSize: 12, background: '#fff', border: '1px solid #e2e8f0', outline: 'none', color: '#0f172a', borderRadius: 2 }}
                onFocus={e => e.target.style.borderColor = '#0f172a'}
                onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
              />
              {/* Priority filter */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => { setShowPriorityDropdown(v => !v); setShowStatusDropdown(false); }}
                  style={{
                    height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    background: showPriorityDropdown || isPriorityFiltered ? '#e2e8f0' : '#fff',
                    border: `1px solid ${showPriorityDropdown || isPriorityFiltered ? '#94a3b8' : '#e2e8f0'}`,
                    color: '#0f172a', transition: 'all 150ms', borderRadius: 2,
                  }}
                >
                  <span>Priority</span>
                  {isPriorityFiltered && (
                    <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activePriorityCount}
                    </span>
                  )}
                  <svg style={{ width: 9, height: 9, transform: showPriorityDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showPriorityDropdown && (
                  <PriorityFilterDropdown
                    selected={selectedPriorities}
                    onToggle={togglePriority}
                    onClear={clearPriorities}
                    onClose={() => setShowPriorityDropdown(false)}
                  />
                )}
              </div>
              {/* Status filter */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => { setShowStatusDropdown(v => !v); setShowPriorityDropdown(false); }}
                  style={{
                    height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    background: showStatusDropdown || isStatusFiltered ? '#e2e8f0' : '#fff',
                    border: `1px solid ${showStatusDropdown || isStatusFiltered ? '#94a3b8' : '#e2e8f0'}`,
                    color: '#0f172a', transition: 'all 150ms', borderRadius: 2,
                  }}
                >
                  <span>Status</span>
                  {isStatusFiltered && (
                    <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeStatusCount}
                    </span>
                  )}
                  <svg style={{ width: 9, height: 9, transform: showStatusDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showStatusDropdown && (
                  <StatusFilterDropdown
                    selected={selectedStatuses}
                    onToggle={toggleStatus}
                    onClear={clearStatuses}
                    onClose={() => setShowStatusDropdown(false)}
                  />
                )}
              </div>
            </div>
            {/* row 2: count */}
            <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
              Showing <span style={{ fontWeight: 600, color: isFiltered ? '#0f172a' : '#94a3b8' }}>{filteredTickets.length}</span> of <span style={{ fontWeight: 600, color: '#0f172a' }}>{allTickets.length}</span> tickets
              {isFiltered && (
                <button
                  onClick={() => { clearPriorities(); clearStatuses(); setSearchQuery(''); STATUS_VALUES.forEach(s => setSelectedStatuses(p => ({...p, [s]: true}))); setSelectedPriorities(Object.fromEntries(PRIORITY_TIERS.map(t => [t, true]))); }}
                  style={{ marginLeft: 10, fontSize: 11, color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#3b82f6'}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {[
                    { label: 'Ticket ID',      w: 110 },
                    { label: 'Subject'                },
                    { label: 'Status',         w: 140 },
                    { label: 'Assigned Agent', w: 160 },
                    { label: 'Priority',       w: 130 },
                  ].map(({ label, w }) => (
                    <th key={label} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'left', width: w, whiteSpace: 'nowrap' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
                      No tickets match the current filters.
                    </td>
                  </tr>
                ) : pagedTickets.map((ticket, i) => {
                  const isSelected = String(ticket.id) === String(selectedTicketId);
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(isSelected ? null : ticket.id)}
                      style={{
                        borderBottom: i < pagedTickets.length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        background: isSelected ? '#f0f9ff' : 'transparent',
                        borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '7px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>#TK-{ticket.id}</td>
                      <td style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a', maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</td>
                      <td style={{ padding: '7px 16px' }}><StatusBadge status={ticket.status} /></td>
                      <td style={{ padding: '7px 16px', fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.assignee?.name ?? '—'}</td>
                      <td style={{ padding: '7px 16px' }}><PriorityBadge priority={ticket.priority} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div style={{ padding: '7px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {filteredTickets.length === 0 ? 'No tickets' : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredTickets.length)} of ${filteredTickets.length}`}
              {isFiltered ? ` (filtered)` : ''}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#fff', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.35 : 1 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2L4 6l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx-1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                .map((p, idx) => p === '…' ? (
                  <span key={`e-${idx}`} style={{ width: 26, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: p === safePage ? '#0f172a' : '#e2e8f0', background: p === safePage ? '#0f172a' : '#fff', color: p === safePage ? '#fff' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))
              }
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#fff', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.35 : 1 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Inspection Drawer — always open at 360px */}
        <div style={{
          width: 360,
          flexShrink: 0,
          borderLeft: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}>
          <div style={{
            width: 360,
            height: '100%',
            display: 'flex', flexDirection: 'column',
            opacity: 1,
            transition: 'opacity 180ms ease',
            transitionDelay: selectedTicketId ? '80ms' : '0ms',
          }}>
            <TicketInspectionDrawer
              selectedTicketId={selectedTicketId}
              isManager
              team={allAgents}
              departments={departments}
              onTakeOver={() => {}}
              hideTakeOver
            />
          </div>
        </div>
      </div>

      {/* ── 3. Heatmap + right sidebar ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

          {/* Ticket Volume Heatmap */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Ticket Volume Heatmap</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['7', '30'].map(d => (
                  <button key={d} onClick={() => setHeatmapRange(d)} style={{
                    padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    background: heatmapRange === d ? '#0f172a' : '#f8fafc',
                    color:      heatmapRange === d ? '#fff'    : '#64748b',
                    border:     heatmapRange === d ? '1px solid #0f172a' : '1px solid #e2e8f0',
                    cursor: 'pointer', transition: 'all 150ms',
                  }}>
                    {d} Days
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'space-around', paddingBottom: 20 }}>
                {TIME_BANDS.map(t => (
                  <span key={t} style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{t}</span>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, height: 160 }}>
                  {HEATMAP_COLORS.map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', flex: 1, gap: 3 }}>
                      {row.map((color, ci) => (
                        <div key={ci} style={{ flex: 1, background: color, borderRadius: 2 }} />
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                  {DAYS.map(d => (
                    <span key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Volume:</span>
              {[['#f1f5f9','Low'],['#94a3b8','Med'],['#64748b','High'],['#0f172a','Peak']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, background: c, borderRadius: 2, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{l}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Top Routing Categories */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f172a' }}>Top Routing Categories</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Category', 'Volume', 'Success Rate', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RETRO_ROWS.map((row, i) => (
                  <tr key={row.category} style={{ borderBottom: i < RETRO_ROWS.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{row.category}</td>
                    <td style={{ padding: '12px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#475569' }}>{row.volume}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 80, height: 4, background: '#e2e8f0', overflow: 'hidden', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${row.rate}%`, background: row.rate >= 90 ? '#22c55e' : '#f59e0b' }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{row.rate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                          <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — System Integrity + Recent Critical Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* System Integrity */}
          <div style={{ background: '#0f172a', padding: '20px 24px', color: '#fff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>System Integrity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Model Node A',   status: 'Operational',  color: '#34d399', pulse: false },
                { label: 'Model Node B',   status: 'Operational',  color: '#34d399', pulse: false },
                { label: 'Training Queue', status: 'High Latency', color: '#fbbf24', pulse: true  },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ opacity: 0.7 }}>{item.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: item.color }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', animation: item.pulse ? 'pulse 2s infinite' : 'none' }} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 16, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', opacity: 0.5 }}>Global Uptime</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>99.98%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '99.98%', background: '#3b82f6' }} />
              </div>
            </div>
          </div>

          {/* Recent Critical Events */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f172a' }}>Recent Critical Events</span>
              <span style={{ padding: '2px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: '0.04em' }}>2 UNREAD</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {[
                { dot: '#ef4444', title: 'SLA Breach Detected — API Tier', body: 'Response latency exceeded 500ms threshold.', time: '14 mins ago' },
                { dot: '#cbd5e1', title: 'Retraining Scheduled',           body: 'Automated model optimization begins 00:00 UTC.', time: '2 hrs ago' },
              ].map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 24px', borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ev.dot, flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>{ev.title}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', marginBottom: 4, lineHeight: '16px' }}>{ev.body}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. IBM watsonx.ai Model Optimization Dock ────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#f8fafc', padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18, color: '#0f172a' }}>
              <rect x="5" y="5" width="10" height="10" rx="0.5" />
              <path d="M7 1v4M13 1v4M7 15v4M13 15v4M1 7h4M1 13h4M15 7h4M15 13h4" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0f172a' }}>
              IBM watsonx.ai Model Optimization
            </span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: '4px 10px', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
            PIPELINE_STABLE_V2
          </span>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, flex: 1 }}>
            <div>
              <div style={labelStyle}>Active Model Pipeline</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '6px 0 8px' }}>watsonx.ai Classify v2.1</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Live Production
              </span>
            </div>
            <div>
              <div style={labelStyle}>Pending Corrected Logs</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 4px' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>142 samples</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>(Ready for retraining)</span>
              </div>
              <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${(142 / 150) * 100}%`, background: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Threshold: 150 samples</div>
            </div>
            <div>
              <div style={labelStyle}>Last Optimization Executed</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '6px 0 4px' }}>14 days ago</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Next scheduled: <span style={{ fontWeight: 700, color: '#0f172a' }}>In 16 days</span>
              </div>
            </div>
          </div>
          <button style={{
            height: 44, padding: '0 24px',
            background: '#0f172a', border: 'none', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            transition: 'background 150ms',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Zm.75 4.75a.75.75 0 0 0-1.5 0v4.69L7.22 9.47a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.06 0l2.75-2.75a.75.75 0 1 0-1.06-1.06l-1.91 1.97V6.75Z" />
            </svg>
            Compile Dataset &amp; Optimize Model
          </button>
        </div>
        {/* Footer */}
        <div style={{ padding: '8px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: 20 }}>
          {[
            { icon: 'M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm-.75-9.75a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Zm.75 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', label: 'Auto-Optimization: On' },
            { icon: 'M8 1a3.5 3.5 0 0 0-3.5 3.5V6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2V4.5A3.5 3.5 0 0 0 8 1Zm0 1.5A2 2 0 0 1 10 4.5V6H6V4.5A2 2 0 0 1 8 2.5Z', label: 'Encryption: AES-256' },
          ].map(({ icon, label }) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8' }}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                <path fillRule="evenodd" d={icon} clipRule="evenodd" />
              </svg>
              {label}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── shared style constants ──────────────────────────────────────────────── */
const labelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: '#94a3b8',
};

const bigNumStyle = {
  fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1,
  fontFamily: "'JetBrains Mono', monospace",
};

const chipStyle = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 4,
  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
};
