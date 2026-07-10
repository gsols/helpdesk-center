/**
 * ManagerAnalyticsPanel — "department_manager_analytics_workload" wireframe
 *
 * Layout:
 *  • 3 metric cards: Active Dept Backlog | MTTR | SLA Breach Rate
 *  • Agent Workload Distribution Matrix (avatar initials + name + role + horizontal load bar + ticket count)
 *  • Footer: HIGH UTILITY / MODERATE / AVAILABLE legend + LATEST DATA SYNC timestamp
 *  • Bottom: two empty placeholder widget areas
 */

const AGENTS = [
  { initials: 'SJ', name: 'Sarah Jenkins',   role: 'Senior Support Engineer',      tickets: 12, pct: 85 },
  { initials: 'AR', name: 'Alex Rivera',      role: 'Intermediate Support',         tickets: 3,  pct: 25 },
  { initials: 'DP', name: 'Daniel Park',      role: 'Lead Technical Specialist',    tickets: 9,  pct: 65 },
  { initials: 'FA', name: 'Fatima Al Zahra',  role: 'Junior Support Associate',     tickets: 2,  pct: 15 },
];

function getBarColor(pct) {
  if (pct >= 80) return '#0f172a';
  if (pct >= 50) return '#475569';
  return '#cbd5e1';
}

export default function ManagerAnalyticsPanel() {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
            Dashboards › Support Analytics
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Manager Analytics Panel</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ height: 36, padding: '0 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
            Export JSON
          </button>
          <button style={{ height: 36, padding: '0 14px', background: '#0f172a', border: 'none', borderRadius: 6, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* 3 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginBottom: 24, border: '1px solid #e2e8f0', background: '#e2e8f0' }}>
        {/* Active Backlog */}
        <div style={{ background: '#ffffff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Active Dept Backlog
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>18</span>
            <span style={{ padding: '2px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#1d4ed8' }}>
              OPEN & IN PROGRESS
            </span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: '72%', background: '#3b82f6' }} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>Queue capacity at 72% utilization</span>
        </div>

        {/* MTTR */}
        <div style={{ background: '#ffffff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Mean Time to Resolution (MTTR)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>3.4</span>
            <span style={{ fontSize: 20, color: '#94a3b8' }}>hrs</span>
            <span style={{ padding: '2px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
              ↓ -8% FROM LAST MONTH
            </span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginBottom: 6, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <div style={{ height: '100%', background: '#22c55e' }} />
            <div style={{ height: '100%', background: '#22c55e' }} />
            <div style={{ height: '100%', background: '#e2e8f0' }} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>Trending towards monthly target: 3.0h</span>
        </div>

        {/* SLA Breach Rate */}
        <div style={{ background: '#ffffff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            SLA Breach Rate
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>5.2%</span>
            <span style={{ fontSize: 18, color: '#dc2626' }}>⚠</span>
            <span style={{ padding: '2px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚠ 2 TICKETS BREACHED
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>CRITICAL THRESHOLD: 6.0%</div>
          <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '87%', background: '#dc2626' }} />
          </div>
        </div>
      </div>

      {/* Agent Workload Distribution Matrix */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Agent Workload Distribution Matrix</h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Real-time tracking of active ticket allocations across active department team members.</p>
          </div>
          <button style={{ height: 32, padding: '0 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            View Active Workloads ▾
          </button>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {AGENTS.map((agent) => (
            <div key={agent.initials}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 4, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                  {agent.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{agent.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{agent.role}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {agent.tickets} Active Tickets
                </div>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${agent.pct}%`, background: getBarColor(agent.pct), borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{agent.pct}% Load</div>
            </div>
          ))}
        </div>

        {/* Footer legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { color: '#0f172a', label: 'HIGH UTILITY' },
              { color: '#475569', label: 'MODERATE' },
              { color: '#cbd5e1', label: 'AVAILABLE' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            LATEST DATA SYNC: {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
          </span>
        </div>
      </div>

      {/* Empty widget placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {['Click to add data source', 'Drop custom widgets here'].map((label) => (
          <div key={label} style={{ border: '1px dashed #e2e8f0', borderRadius: 4, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, color: '#e2e8f0' }}>⊞</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
