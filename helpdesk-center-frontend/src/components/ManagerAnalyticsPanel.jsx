/**
 * ManagerAnalyticsPanel — wired to real backend data.
 *
 * Data sources:
 *  • GET /api/analytics/dept-summary  → backlogCount, breachedCount, totalActive, mttrHours
 *  • GET /api/users/team              → agents with activeTicketCount
 *
 * Agent load bar design matches the existing /agent/team TeamPage pattern:
 *  MAX_LOAD = 10 tickets → 100%
 *  ≥80% → near-black  |  ≥40% → slate  |  <40% → light
 */
import { useTeam }        from '../hooks/useUsers';
import { useDeptSummary } from '../hooks/useAnalytics';
import { useQueryClient } from '@tanstack/react-query';

const MAX_LOAD = 10;

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function barColor(pct) {
  if (pct >= 80) return '#0f172a';
  if (pct >= 40) return '#64748b';
  return '#cbd5e1';
}

function legendDot(color) {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%',
      background: color, display: 'inline-block', flexShrink: 0,
    }} />
  );
}

function LiveSync() {
  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace",
    }}>
      LATEST DATA SYNC: {now} UTC
    </span>
  );
}

export default function ManagerAnalyticsPanel() {
  const qc = useQueryClient();

  const { data: summary, isLoading: loadingSummary } = useDeptSummary();
  const { data: team = [],    isLoading: loadingTeam }    = useTeam();

  // ── Derived values ────────────────────────────────────────────────────────
  const backlog       = summary?.backlogCount  ?? 0;
  const totalActive   = summary?.totalActive   ?? 0;
  const breachedCount = summary?.breachedCount ?? 0;
  const mttrRaw       = summary?.mttrHours     != null ? Number(summary.mttrHours) : null;
  const mttrDisplay   = mttrRaw != null ? mttrRaw.toFixed(1) : '—';

  // Queue utilisation: backlog / totalActive (or 0 if no active tickets)
  const queueUtilPct = totalActive > 0 ? Math.min(Math.round((backlog / totalActive) * 100), 100) : 0;

  // SLA breach rate: breached / totalActive * 100
  const slaBreachPct  = totalActive > 0
    ? ((breachedCount / totalActive) * 100).toFixed(1)
    : '0.0';
  const slaBarPct     = totalActive > 0
    ? Math.min(Math.round((breachedCount / totalActive) * 100), 100)
    : 0;
  const slaIsRed      = Number(slaBreachPct) >= 4;

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['analytics', 'dept-summary'] });
    qc.invalidateQueries({ queryKey: ['team'] });
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
            Dashboards › Support Analytics
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Manager Analytics Panel</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleRefresh}
            style={{ height: 36, padding: '0 14px', background: '#0f172a', border: 'none', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── 3 metric cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, marginBottom: 24, border: '1px solid #e2e8f0', background: '#e2e8f0' }}>

        {/* Card A — Active Dept Backlog */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Active Dept Backlog
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
              {loadingSummary ? '…' : backlog}
            </span>
            <span style={{ padding: '2px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>
              OPEN &amp; IN PROGRESS
            </span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${queueUtilPct}%`, background: '#3b82f6', transition: 'width 400ms ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Queue capacity at {queueUtilPct}% utilization
          </span>
        </div>

        {/* Card B — MTTR */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Mean Time to Resolution (MTTR)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
              {loadingSummary ? '…' : mttrDisplay}
            </span>
            <span style={{ fontSize: 20, color: '#94a3b8' }}>hrs</span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: mttrRaw != null ? `${Math.min(Math.round((mttrRaw / 24) * 100), 100)}%` : '0%', background: '#22c55e', transition: 'width 400ms ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {mttrRaw != null ? 'Based on resolved tickets in your department' : 'No resolved tickets yet'}
          </span>
        </div>

        {/* Card C — SLA Breach Rate */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            SLA Breach Rate
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: slaIsRed ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
              {loadingSummary ? '…' : `${slaBreachPct}%`}
            </span>
            {slaIsRed && <span style={{ fontSize: 18, color: '#dc2626' }}>⚠</span>}
            {breachedCount > 0 && (
              <span style={{ padding: '2px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#dc2626' }}>
                ⚠ {breachedCount} {breachedCount === 1 ? 'TICKET' : 'TICKETS'} BREACHED
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>CRITICAL THRESHOLD: 6.0%</div>
          <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${slaBarPct}%`, background: slaIsRed ? '#dc2626' : '#22c55e', transition: 'width 400ms ease' }} />
          </div>
        </div>
      </div>

      {/* ── Agent Workload Distribution Matrix ─────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Agent Workload Distribution Matrix</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Real-time tracking of active ticket allocations across active department team members.</p>
        </div>

        {loadingTeam ? (
          <div style={{ padding: '24px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Loading…</div>
        ) : team.length === 0 ? (
          <div style={{ padding: '24px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No agents found in your department.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {team.map((member, i) => {
              const count  = member.activeTicketCount ?? 0;
              const pct    = Math.min(Math.round((count / MAX_LOAD) * 100), 100);
              const color  = barColor(pct);
              const isLast = i === team.length - 1;

              return (
                <div
                  key={member.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#e2e8f0', border: '1.5px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0,
                      }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30', marginBottom: 1 }}>
                          {member.name}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
                          {member.departmentName ?? 'Agent'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0b1c30', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                      {count} Active {count === 1 ? 'Ticket' : 'Tickets'}
                    </span>
                  </div>

                  {/* Load bar */}
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 0, overflow: 'hidden', width: '100%', marginBottom: 5 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 300ms ease' }} />
                  </div>

                  {/* Load % */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}% Load</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer legend */}
        {!loadingTeam && team.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {legendDot('#0f172a')}
                <span style={legendLabel}>High Utility</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {legendDot('#64748b')}
                <span style={legendLabel}>Moderate</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {legendDot('#cbd5e1')}
                <span style={legendLabel}>Available</span>
              </span>
            </div>
            <LiveSync />
          </div>
        )}
      </div>
    </div>
  );
}

const legendLabel = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: '#64748b',
};
