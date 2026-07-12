/**
 * AdminOverviewPanel
 *
 * Overview dashboard for SYS_ADMIN — design language aligned with
 * ManagerAnalyticsPanel / StatCard / existing inline-style conventions:
 *   - colour palette: #0f172a, #94a3b8, #e2e8f0, #f1f5f9, #0b1c30
 *   - section padding: 20px 24px
 *   - mono font: JetBrains Mono for data values
 *   - gap-1 / 1px separator grid for metric cards
 *
 * Data sourced from GET /api/analytics/admin-overview
 */
import { useAdminOverview } from '../hooks/useAnalytics';
import { useQueryClient }   from '@tanstack/react-query';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmt(n, decimals = 1) {
  if (n == null) return '—';
  return Number(n).toFixed(decimals);
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function timeAgo(isoStr) {
  if (!isoStr) return '—';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function barColor(pct) {
  if (pct >= 80) return '#0f172a';
  if (pct >= 40) return '#64748b';
  return '#cbd5e1';
}

/* ── section shell ───────────────────────────────────────────────────────── */
function Section({ title, right, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#0f172a',
        }}>
          {title}
        </span>
        {right && (
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{right}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── status / priority inline chips ─────────────────────────────────────── */
const STATUS_CHIP = {
  OPEN:             { bg: '#fffbeb', border: '#fde68a', color: '#92400e', label: 'OPEN'        },
  IN_PROGRESS:      { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', label: 'IN PROGRESS' },
  RESOLVED:         { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', label: 'RESOLVED'    },
  CLOSED:           { bg: '#f8fafc', border: '#e2e8f0', color: '#475569', label: 'CLOSED'      },
  PENDING_EMPLOYEE: { bg: '#faf5ff', border: '#e9d5ff', color: '#7e22ce', label: 'PENDING'     },
};

const PRIORITY_CHIP = {
  CRITICAL: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
  HIGH:     { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
  MEDIUM:   { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
  LOW:      { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
};

function StatusChip({ status }) {
  const s = STATUS_CHIP[status] ?? STATUS_CHIP.CLOSED;
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 4,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 10, fontWeight: 700, color: s.color,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function PriorityChip({ priority }) {
  const p = PRIORITY_CHIP[priority] ?? PRIORITY_CHIP.MEDIUM;
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 4,
      background: p.bg, border: `1px solid ${p.border}`,
      fontSize: 10, fontWeight: 700, color: p.color,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {priority}
    </span>
  );
}

/* ── SLA compliance arc ──────────────────────────────────────────────────── */
function SlaArc({ value }) {
  const pct   = value != null ? Math.min(Number(value), 100) : null;
  const r     = 22;
  const circ  = 2 * Math.PI * r;
  const dash  = pct != null ? circ * (1 - pct / 100) : circ;
  const color = pct == null ? '#e2e8f0' : pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg viewBox="0 0 48 48" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
          {pct != null ? `${Math.round(pct)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

/* ── Metric card (single cell in the top banner) ─────────────────────────── */
function MetricCard({ label, value, unit, badge, bar, barColor: bColor = '#3b82f6', note, last }) {
  return (
    <div style={{
      background: '#fff',
      padding: '20px 24px',
      borderRight: last ? 'none' : '1px solid #e2e8f0',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: badge || bar ? 10 : 0 }}>
        <span style={{
          fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 400 }}>{unit}</span>
        )}
      </div>
      {badge && (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px', borderRadius: 4,
          background: badge.bg, border: `1px solid ${badge.border}`,
          fontSize: 10, fontWeight: 700, color: badge.color,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {badge.text}
        </span>
      )}
      {bar != null && (
        <div style={{ marginTop: badge ? 8 : 0 }}>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', width: `${Math.min(bar, 100)}%`, background: bColor, transition: 'width 400ms ease' }} />
          </div>
          {note && <span style={{ fontSize: 11, color: '#94a3b8' }}>{note}</span>}
        </div>
      )}
    </div>
  );
}

/* ── Department Breakdown ────────────────────────────────────────────────── */
function DeptBreakdown({ rows }) {
  if (!rows?.length) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
        No department data.
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {['Department', 'Open', 'In Progress', 'Resolved', 'MTTR (hrs)'].map((h, i) => (
              <th key={h} style={{
                padding: '10px 20px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: '#94a3b8',
                textAlign: i === 0 ? 'left' : 'center',
                whiteSpace: 'nowrap',
                borderRight: i < 4 ? '1px solid #f1f5f9' : 'none',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.departmentId}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#0f172a', borderRight: '1px solid #f1f5f9' }}>
                {r.departmentName}
              </td>
              <td style={{ padding: '12px 20px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#b45309' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                  {r.openCount ?? 0}
                </span>
              </td>
              <td style={{ padding: '12px 20px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
                  {r.inProgressCount ?? 0}
                </span>
              </td>
              <td style={{ padding: '12px 20px', textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  {r.resolvedCount ?? 0}
                </span>
              </td>
              <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  {r.mttrHours != null ? fmt(r.mttrHours) : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Agent Performance ───────────────────────────────────────────────────── */
const MAX_LOAD = 10;

function AgentPerformance({ rows }) {
  if (!rows?.length) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
        No agents found.
      </div>
    );
  }
  return (
    <div style={{ padding: '4px 0' }}>
      {rows.map((r, i) => {
        const pct   = Math.min(Math.round(((r.activeCount ?? 0) / MAX_LOAD) * 100), 100);
        const color = barColor(pct);
        const isLast = i === rows.length - 1;
        return (
          <div
            key={r.agentId}
            style={{
              padding: '12px 24px',
              borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
            }}
          >
            {/* Name + count row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0,
                }}>
                  {initials(r.agentName)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30', lineHeight: '16px' }}>
                    {r.agentName}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', lineHeight: '14px' }}>
                    {r.departmentName ?? 'Agent'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#0b1c30' }}>
                  {r.activeCount ?? 0} active
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
                  / {r.resolvedCount ?? 0} resolved
                </span>
              </div>
            </div>
            {/* Load bar */}
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 0, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 300ms ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}% load</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Recent Activity Feed ────────────────────────────────────────────────── */
function RecentActivity({ items }) {
  if (!items?.length) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
        No recent activity.
      </div>
    );
  }
  return (
    <div>
      {items.slice(0, 12).map((item, i) => (
        <div
          key={item.ticketId}
          style={{
            padding: '12px 24px',
            borderBottom: i < Math.min(items.length, 12) - 1 ? '1px solid #f1f5f9' : 'none',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {/* Status indicator dot */}
          <div style={{ paddingTop: 3, flexShrink: 0 }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: (STATUS_CHIP[item.status] ?? STATUS_CHIP.CLOSED).border.replace('200', '400'),
            }} />
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: 700, color: '#3b82f6',
              }}>
                #TK-{item.ticketId}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                {item.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusChip status={item.status} />
              <PriorityChip priority={item.priority} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {item.departmentName ?? 'Triage'}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}>
            {timeAgo(item.updatedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function AdminOverviewPanel() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useAdminOverview();

  const handleRefresh = () =>
    qc.invalidateQueries({ queryKey: ['analytics', 'admin-overview'] });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontSize: 13, color: '#94a3b8' }}>
        Loading overview…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontSize: 13, color: '#dc2626' }}>
        Failed to load overview data.
      </div>
    );
  }

  const totalActive     = (data.openCount ?? 0) + (data.inProgressCount ?? 0);
  const slaVal          = data.slaComplianceRate != null ? Number(data.slaComplianceRate) : null;
  const slaLabel        = slaVal == null ? '—' : slaVal >= 90 ? '▲ On Target' : slaVal < 70 ? '▼ Below Threshold' : '● Needs Improvement';
  const slaLabelColor   = slaVal == null ? '#94a3b8' : slaVal >= 90 ? '#15803d' : slaVal < 70 ? '#dc2626' : '#b45309';
  const frtVal          = data.avgFrtHours != null ? Number(data.avgFrtHours) : null;
  const frtBarPct       = frtVal != null ? Math.min((frtVal / 8) * 100, 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
            Admin › Overview
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            System Overview
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          style={{ height: 36, padding: '0 16px', background: '#0f172a', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {/* ── Metric banner — 5 cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0' }}>
        <MetricCard
          label="Open Tickets"
          value={data.openCount ?? 0}
          badge={data.openCount > 0
            ? { text: 'Active', bg: '#fffbeb', border: '#fde68a', color: '#b45309' }
            : { text: 'Clear',  bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }}
        />
        <MetricCard
          label="In Progress"
          value={data.inProgressCount ?? 0}
          bar={totalActive > 0 ? ((data.inProgressCount ?? 0) / totalActive) * 100 : 0}
          barColor="#3b82f6"
          note={`${totalActive} total active`}
        />
        <MetricCard
          label="Resolved"
          value={data.resolvedCount ?? 0}
          badge={{ text: 'Done', bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }}
        />
        <MetricCard
          label="Triage Queue"
          value={data.triageCount ?? 0}
          badge={data.triageCount > 0
            ? { text: 'Needs Routing', bg: '#fef2f2', border: '#fecaca', color: '#dc2626' }
            : { text: 'Clear',         bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }}
        />
        <MetricCard
          label="SLA Breached"
          value={data.breachedCount ?? 0}
          badge={data.breachedCount > 0
            ? { text: `${data.breachedCount} Alert${data.breachedCount > 1 ? 's' : ''}`, bg: '#fef2f2', border: '#fecaca', color: '#dc2626' }
            : { text: 'No Breach', bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }}
          last
        />
      </div>

      {/* ── SLA Compliance + Avg FRT row ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0' }}>

        {/* SLA Compliance */}
        <div style={{ background: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <SlaArc value={data.slaComplianceRate} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
              SLA Compliance Rate
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
              {slaVal != null ? `${slaVal.toFixed(1)}%` : '—'}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: slaLabelColor }}>{slaLabel}</span>
          </div>
        </div>

        {/* Avg FRT */}
        <div style={{ background: '#fff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
            Avg First Response Time
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
              {frtVal != null ? frtVal.toFixed(1) : '—'}
            </span>
            {frtVal != null && <span style={{ fontSize: 16, color: '#94a3b8' }}>hrs</span>}
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${frtBarPct}%`, background: frtBarPct > 75 ? '#dc2626' : '#22c55e', transition: 'width 400ms ease' }} />
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Target: &lt; 2 hrs</span>
        </div>
      </div>

      {/* ── Department Breakdown ─────────────────────────────────────────────── */}
      <Section title="Department Breakdown" right={`${data.deptBreakdown?.length ?? 0} departments`}>
        <DeptBreakdown rows={data.deptBreakdown} />
      </Section>

      {/* ── Agent Performance + Recent Activity side-by-side ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        <Section title="Agent Performance" right={`${data.agentSummary?.length ?? 0} agents`}>
          <AgentPerformance rows={data.agentSummary} />
        </Section>

        <Section title="Recent Activity" right="Last 12 updated">
          <RecentActivity items={data.recentActivity} />
        </Section>

      </div>

    </div>
  );
}
