/**
 * ManagerQueueTable — Manager Queue tab
 *
 * Data: GET /api/tickets/dept-queue → all active (non-resolved, non-closed) tickets
 *       in the caller's department, assigned + unassigned alike.
 *       Polls every 30 s via useDeptQueue.
 *
 * Agent filter dropdown is populated from the real team via useTeam().
 *
 * Columns: TICKET ID | SUBJECT | PRIORITY | STATUS | ASSIGNED AGENT | SLA TRACKING
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDeptQueue } from '../hooks/useTickets';
import { useTeam }       from '../hooks/useUsers';
import { useQueryClient } from '@tanstack/react-query';
import StatusBadge from './StatusBadge';
import TicketInspectionDrawer from './TicketInspectionDrawer';
import { Search } from 'lucide-react';

const PRIORITY_STYLES = {
  HIGH:     { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  MEDIUM:   { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  LOW:      { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  CRITICAL: { bg: '#fef2f2', text: '#7f1d1d', border: '#fca5a5' },
};

function PriorityBadge({ priority }) {
  const p = priority?.toUpperCase() ?? 'MEDIUM';
  const s = PRIORITY_STYLES[p] ?? PRIORITY_STYLES.MEDIUM;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 11, fontWeight: 700, color: s.text,
    }}>
      {p}
    </span>
  );
}


/* SlaCell receives `now` from the parent so Date.now() is never called during render */
function SlaCell({ ticket, now }) {
  if (!ticket.dueAt) return <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>;

  const due     = new Date(ticket.dueAt).getTime();
  const created = new Date(ticket.createdAt).getTime();
  const total   = due - created;
  const elapsed = now - created;
  const pct     = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const minsLeft = Math.max(0, Math.round((due - now) / 60000));

  if (ticket.status === 'RESOLVED') {
    const resolvedIn = ticket.resolvedAt
      ? Math.round((new Date(ticket.resolvedAt) - created) / 60000)
      : null;
    return (
      <div>
        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: '100%', background: '#22c55e' }} />
        </div>
        <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
          Met{resolvedIn ? ` (${Math.round(resolvedIn / 60)}h)` : ''}
        </span>
      </div>
    );
  }

  if (due < now) {
    return (
      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
        ⚠ BREACHED +{Math.round((now - due) / 60000)}m
      </span>
    );
  }

  const color = pct > 80 ? '#dc2626' : pct > 60 ? '#f59e0b' : '#22c55e';
  const h     = Math.floor(minsLeft / 60);
  const m     = minsLeft % 60;
  return (
    <div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>
        {h > 0 ? `${h}h ${m}m left` : `${m}m left`}
        {pct > 80 && ' · High Urgency'}
      </span>
    </div>
  );
}

/* Live "last synced Xs ago" counter */
function useSyncAge(dataUpdatedAt) {
  const [age, setAge] = useState(0);
  useEffect(() => {
    if (!dataUpdatedAt) return;
    const tick = () => setAge(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);
  return age;
}

/* ── Draggable divider width ─────────────────────────────────────────────── */
const DIVIDER_W    = 5;
const MIN_LEFT_PCT = 25;
const MAX_LEFT_PCT = 75;
const DEFAULT_PCT  = 70;

function useSplitDrag(initialPct) {
  const [pct, setPct]       = useState(initialPct);
  const dragging            = useRef(false);
  const containerRef        = useRef(null);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect  = containerRef.current.getBoundingClientRect();
    const raw   = ((e.clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, raw)));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return { pct, containerRef, onPointerDown, onPointerMove, onPointerUp };
}

export default function ManagerQueueTable() {
  const qc = useQueryClient();
  const { data: tickets = [], isLoading, dataUpdatedAt } = useDeptQueue();
  const { data: team = [] } = useTeam();
  const [selectedId,   setSelectedId]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgent,  setFilterAgent]  = useState('');

  /* `now` ticks every 60 s so SLA bars stay accurate without calling Date.now() in render */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const syncAge = useSyncAge(dataUpdatedAt);
  const { pct, containerRef, onPointerDown, onPointerMove, onPointerUp } = useSplitDrag(DEFAULT_PCT);

  /* Agent names from real backend data */
  const agentNames = team.map(m => m.name).filter(Boolean);

  const filtered = tickets.filter(t => {
    const q      = search.toLowerCase().trim();
    const matchQ = !q || t.title?.toLowerCase().includes(q) || String(t.id).includes(q);
    const matchS = !filterStatus || t.status === filterStatus;
    const matchA = !filterAgent
      || (filterAgent === '__unassigned__' ? !t.assignee : t.assignee?.name === filterAgent);
    return matchQ && matchS && matchA;
  });

  const openCount     = tickets.filter(t => t.status === 'OPEN').length;
  const inProgCount   = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const unassignedCnt = tickets.filter(t => !t.assignee).length;
  const breachedCount = tickets.filter(t =>
    t.dueAt && new Date(t.dueAt).getTime() < now && t.status !== 'RESOLVED'
  ).length;

  /* Auto-select the first filtered ticket when nothing is explicitly chosen */
  const effectiveSelectedId = selectedId ?? (filtered.length > 0 ? filtered[0].id : null);

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['tickets', 'dept-queue'] });
  };

  return (
    <>
    {/* Full-height split container — fills the noPadding AppShell main area */}
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        display: 'flex', flex: 1, minHeight: 0,
        height: '100%', overflow: 'hidden',
        background: '#f8f9ff',
        userSelect: 'none',
      }}
    >
    {/* ── Left pane: ticket table ────────────────────────────────── */}
    <div style={{ width: `${pct}%`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>

      {/* ── Search + filter bar ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 5, padding: '0 10px', height: 30, background: '#f8fafc' }}>
          <Search size={13} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ID…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#0f172a' }}
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ height: 30, padding: '0 8px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, background: '#fff', color: '#374151', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Statuses</option>
          {['OPEN', 'IN_PROGRESS', 'PENDING_EMPLOYEE'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Agent filter — real names from backend */}
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          style={{ height: 30, padding: '0 8px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, background: '#fff', color: '#374151', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Agents</option>
          <option value="__unassigned__">Unassigned</option>
          {agentNames.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          style={{ height: 30, padding: '0 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          Refresh
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Ticket ID', 'Subject', 'Priority', 'Status', 'Assigned Agent', 'SLA Tracking'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '6px 12px',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: '#94a3b8',
                    textAlign: 'left', whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Loading department queue…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  {tickets.length === 0 ? 'No active tickets in this department.' : 'No tickets match your filters.'}
                </td>
              </tr>
            ) : filtered.map(t => {
              const isSelected = String(t.id) === String(effectiveSelectedId);
              return (
              <tr
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                style={{
                  borderBottom: '1px solid #f1f5f9', transition: 'background 100ms',
                  cursor: 'pointer',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent'; }}
              >
                {/* Ticket ID */}
                <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>
                    #TK-{t.id}
                  </span>
                </td>

                {/* Subject */}
                <td style={{ padding: '7px 12px', fontSize: 12, color: '#0f172a', maxWidth: 260 }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.title}
                  </span>
                </td>

                {/* Priority */}
                <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                  <PriorityBadge priority={t.priority} />
                </td>

                {/* Status */}
                <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                  <StatusBadge status={t.status} />
                </td>

                {/* Assigned Agent — read-only */}
                <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                  {t.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#1e293b', border: '1.5px solid #334155',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
                      }}>
                        {(t.assignee.name ?? '?').split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontSize: 12, color: '#0f172a' }}>{t.assignee.name}</span>
                    </div>
                  ) : (
                    <span style={{
                      display: 'inline-block', padding: '1px 6px', borderRadius: 3,
                      background: '#fef2f2', border: '1px solid #fecaca',
                      fontSize: 10, fontWeight: 700, color: '#dc2626',
                    }}>
                      Unassigned
                    </span>
                  )}
                </td>

                {/* SLA */}
                <td style={{ padding: '7px 12px', minWidth: 130 }}>
                  <SlaCell ticket={t} now={now} />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { color: '#22c55e', label: `${openCount} Open` },
            { color: '#3b82f6', label: `${inProgCount} In Progress` },
            { color: '#f59e0b', label: `${unassignedCnt} Unassigned` },
            { color: '#dc2626', label: `${breachedCount} Breached` },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
          {dataUpdatedAt
            ? `Last sync: ${syncAge < 5 ? 'just now' : `${syncAge}s ago`}`
            : 'Syncing…'}
        </span>
      </div>
    </div>

    {/* ── Drag handle ──────────────────────────────────────────────── */}
    <div
      onPointerDown={onPointerDown}
      style={{
        width: DIVIDER_W,
        flexShrink: 0,
        background: '#e2e8f0',
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 150ms',
      }}
      onMouseEnter={(e)  => { e.currentTarget.style.background = '#3b82f6'; }}
      onMouseLeave={(e)  => { e.currentTarget.style.background = '#e2e8f0'; }}
    >
      {/* Grip dots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'none' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} />
        ))}
      </div>
    </div>

    {/* ── Right pane: inspection drawer ───────────────────────────── */}
    <div style={{ width: `calc(${100 - pct}% - ${DIVIDER_W}px)`, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <TicketInspectionDrawer
        selectedTicketId={effectiveSelectedId}
        isManager
        team={team}
        hideTakeOver
      />
    </div>
    </div>
    </>
  );
}
