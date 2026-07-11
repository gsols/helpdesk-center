/**
 * ManagerTeamDirectory — Team Directory tab for the Manager Dashboard
 *
 * Data sources:
 *  • GET /api/users/team        → agents with activeTicketCount, departmentName
 *  • GET /api/analytics/dept-summary → backlogCount, breachedCount, totalActive, mttrHours
 *
 * "View Workspace" navigates to /agent/team/:peerId (TeammateWorkspacePage).
 *
 * Agent status is derived from activeTicketCount:
 *   0        → Offline   (slate)
 *   1–4      → Available (emerald)
 *   5–8      → Busy      (amber)
 *   9+       → Critical  (red)
 *
 * MAX_LOAD = 10 for workload bar width.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam }                    from '../hooks/useUsers';
import { useDeptSummary, useDeptDaily } from '../hooks/useAnalytics';
import { useQueryClient } from '@tanstack/react-query';

const MAX_LOAD   = 10;
const PAGE_SIZE  = 8;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function agentStatus(count) {
  if (count === 0)  return 'Offline';
  if (count <= 4)   return 'Available';
  if (count <= 8)   return 'Busy';
  return 'Critical';
}

const STATUS_STYLES = {
  Available: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  Busy:      { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  Critical:  { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
  Offline:   { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Offline;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 4, border: `1px solid ${s.border}`,
      background: s.bg, fontSize: 11, fontWeight: 700, color: s.text,
    }}>
      {status === 'Available' && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      )}
      {status}
    </span>
  );
}

function WorkloadBar({ count }) {
  const pct    = Math.min(Math.round((count / MAX_LOAD) * 100), 100);
  const status = agentStatus(count);
  const color  = STATUS_STYLES[status]?.dot ?? '#94a3b8';
  return (
    <div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
        {count} Open
      </span>
      <div style={{ width: 96, height: 4, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden', marginTop: 6 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 300ms ease' }} />
      </div>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: '#e2e8f0', border: '1px solid #cbd5e1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ManagerTeamDirectory() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: team = [],   isLoading: loadingTeam }    = useTeam();
  const { data: summary,     isLoading: loadingSummary } = useDeptSummary();
  const { data: daily = [],  isLoading: loadingDaily }   = useDeptDaily();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  /* Derived summary stats */
  const totalAgents   = team.length;
  const activeNow     = team.filter(m => (m.activeTicketCount ?? 0) > 0).length;
  const avgWorkload   = totalAgents > 0
    ? (team.reduce((s, m) => s + (m.activeTicketCount ?? 0), 0) / totalAgents).toFixed(1)
    : '0.0';

  /* SLA violations (breached tickets count from summary) */
  const breachedCount = summary?.breachedCount ?? 0;

  /* Daily chart — normalise to last 7 days; fill gaps with 0 */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyMap = Object.fromEntries(
    (daily ?? []).map(d => [d.dayLabel?.slice(0, 3), d.ticketCount ?? 0])
  );
  const maxDaily = Math.max(1, ...Object.values(dailyMap));

  /* Filter + paginate */
  const filtered   = team.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['team'] });
    qc.invalidateQueries({ queryKey: ['analytics', 'dept-summary'] });
    qc.invalidateQueries({ queryKey: ['analytics', 'dept-daily'] });
  };

  return (
    <div>

      {/* ── Header section ──────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0',
        marginBottom: 16,
      }}>
        {/* Title bar */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0b1c30', margin: 0 }}>
            Team Directory
            {team[0]?.departmentName ? `: ${team[0].departmentName}` : ''}
          </h2>
          <button
            onClick={handleRefresh}
            style={{
              height: 36, padding: '0 16px',
              background: '#0f172a', color: '#ffffff',
              border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stat cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: 'none' }}>
          {/* Total Agents */}
          <div style={{ padding: 16, borderRight: '1px solid #e2e8f0' }}>
            <div style={{
              background: '#f8fafc', padding: 16, borderRadius: 6,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                Total Agents
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0b1c30', lineHeight: 1 }}>
                {loadingTeam ? '…' : totalAgents}
              </div>
            </div>
          </div>

          {/* Active Now */}
          <div style={{ padding: 16, borderRight: '1px solid #e2e8f0' }}>
            <div style={{
              background: '#f8fafc', padding: 16, borderRadius: 6,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                Active Now
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0b1c30', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                {loadingTeam ? '…' : activeNow}
                {!loadingTeam && (
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 3px rgba(34,197,94,0.25)' }} />
                )}
              </div>
            </div>
          </div>

          {/* Avg Workload */}
          <div style={{ padding: 16 }}>
            <div style={{
              background: '#f8fafc', padding: 16, borderRadius: 6,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
                Avg Workload
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0b1c30', lineHeight: 1 }}>
                {loadingTeam ? '…' : avgWorkload}{' '}
                <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>tickets/agent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Team table ──────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Search bar */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid #e2e8f0', borderRadius: 6,
            padding: '0 12px', height: 34, background: '#ffffff', maxWidth: 360,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search agents…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#0f172a' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Agent', 'Status', 'Current Workload', 'Department', 'Open Tickets', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase', color: '#64748b',
                      textAlign: i === 5 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderCollapse: 'collapse' }}>
              {loadingTeam ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Loading…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No agents found.
                  </td>
                </tr>
              ) : paginated.map((member) => {
                const count  = member.activeTicketCount ?? 0;
                const status = agentStatus(count);
                const isOffline = status === 'Offline';
                return (
                  <tr
                    key={member.id}
                    style={{ borderBottom: '1px solid #f1f5f9', opacity: isOffline ? 0.65 : 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Agent */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={member.name} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0b1c30', whiteSpace: 'nowrap' }}>
                          {member.name}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={status} />
                    </td>

                    {/* Workload bar */}
                    <td style={{ padding: '12px 16px' }}>
                      <WorkloadBar count={count} />
                    </td>

                    {/* Department */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {member.departmentName ?? '—'}
                    </td>

                    {/* Open Tickets count */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13, fontWeight: 500, color: '#0f172a',
                      }}>
                        {count}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/manager/team/${member.id}`)}
                        style={{
                          padding: '5px 12px',
                          border: '1px solid #e2e8f0', borderRadius: 6,
                          background: '#ffffff', cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, color: '#0f172a',
                          whiteSpace: 'nowrap',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        View Workspace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{
          padding: '10px 16px', background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Showing {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} agents
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e2e8f0', borderRadius: 6, background: '#ffffff',
                cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #e2e8f0', borderRadius: 6,
                  background: page === n ? '#0f172a' : '#ffffff',
                  color: page === n ? '#ffffff' : '#374151',
                  fontSize: 13, fontWeight: page === n ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e2e8f0', borderRadius: 6, background: '#ffffff',
                cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Performance Snapshot + SLA Violations ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>

        {/* Performance Snapshot: resolved tickets per day (last 7 days) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>
              Performance Snapshot
            </h3>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
              Resolved tickets · last 7 days
            </span>
          </div>

          {loadingDaily ? (
            <div style={{ height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
          ) : (
            <>
              {/* Bar chart */}
              <div style={{ height: 128, display: 'flex', alignItems: 'flex-end', gap: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
                {DAYS.map(day => {
                  const count = dailyMap[day] ?? 0;
                  const pct   = Math.min((count / maxDaily) * 100, 100);
                  const isToday = new Date().toLocaleString('en-US', { weekday: 'short' }).slice(0, 3) === day;
                  return (
                    <div
                      key={day}
                      title={`${day}: ${count} resolved`}
                      style={{
                        flex: 1, minWidth: 0,
                        background: isToday ? '#0f172a' : '#e2e8f0',
                        height: `${Math.max(pct, 4)}%`,
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 400ms ease',
                        cursor: 'default',
                        opacity: count === 0 ? 0.4 : 1,
                      }}
                    />
                  );
                })}
              </div>
              {/* Day labels */}
              <div style={{ display: 'flex', gap: 4, paddingLeft: 4, paddingRight: 4, marginTop: 6 }}>
                {DAYS.map(day => (
                  <div
                    key={day}
                    style={{
                      flex: 1, minWidth: 0,
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: '#94a3b8',
                      textAlign: 'center', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SLA Violations panel */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', margin: '0 0 16px' }}>
            SLA Status (Dept)
          </h3>

          {loadingSummary ? (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Breached */}
              {breachedCount > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', margin: 0, lineHeight: '18px' }}>
                      {breachedCount} SLA {breachedCount === 1 ? 'Breach' : 'Breaches'}
                    </p>
                    <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>Active tickets past due date</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: 0, lineHeight: '18px' }}>No Active Breaches</p>
                    <p style={{ fontSize: 11, color: '#16a34a', margin: 0 }}>All tickets within SLA</p>
                  </div>
                </div>
              )}

              {/* Backlog */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: '18px' }}>
                    {summary?.backlogCount ?? '—'} Backlog
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Open + In Progress</p>
                </div>
              </div>

              {/* MTTR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: '18px' }}>
                    {summary?.mttrHours != null ? `${Number(summary.mttrHours).toFixed(1)}h MTTR` : '— MTTR'}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Mean time to resolution</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/manager/analytics')}
            style={{
              width: '100%', marginTop: 16, padding: '8px 0',
              border: '1px solid #e2e8f0', borderRadius: 6,
              background: '#ffffff', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase', color: '#64748b',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            Full SLA Analytics →
          </button>
        </div>
      </div>
    </div>
  );
}
