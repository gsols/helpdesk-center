/**
 * ManagerRiskQueue — "department_manager_risk_breach_mitigation" wireframe
 *
 * Layout:
 *  • Amber CRITICAL SYSTEM MONITOR banner (dismissable)
 *  • Sort bar + "4 Urgent High Risk Targets" chip + Filters
 *  • Table: TICKET ID | PRIORITY TIER | ASSIGNED AGENT | RE-ROUTING DEADLINE | ESCALATION TARGET
 *    - Near-breach rows: amber progress bar + "X minutes remaining / Y% ELAPSED"
 *    - Breached rows: full-width red "EXPIRED / BREACHED BY Xh Ym" + alarm bell icon (animated)
 *  • Footer: Download Risk Report + Bulk Reassign + Page 1 of 1 pagination
 */
import { useState } from 'react';

const MOCK_RISK_TICKETS = [
  { id: 'TCK-1045', priority: 'HIGH',     agent: { initials: 'DP', name: 'Daniel Park'   }, minsLeft: 14, pctElapsed: 90, breached: false,  breachedBy: null },
  { id: 'TCK-1022', priority: 'CRITICAL', agent: null,                                       minsLeft:  0, pctElapsed: 100, breached: true,  breachedBy: '2H 15M' },
  { id: 'TCK-1089', priority: 'HIGH',     agent: { initials: 'SJ', name: 'Sarah Jenkins' }, minsLeft: 38, pctElapsed: 75, breached: false,  breachedBy: null },
  { id: 'TCK-0912', priority: 'CRITICAL', agent: { initials: 'MT', name: 'Marcus Thorne'  }, minsLeft:  0, pctElapsed: 100, breached: true, breachedBy: '14M' },
];

function PriorityChip({ priority }) {
  const isC = priority === 'CRITICAL';
  return (
    <span style={{
      padding: '3px 10px',
      background: isC ? '#fef2f2' : '#fff7ed',
      border: `1px solid ${isC ? '#fecaca' : '#fed7aa'}`,
      borderRadius: 4, fontSize: 11, fontWeight: 700,
      color: isC ? '#dc2626' : '#c2410c',
    }}>
      {priority}
    </span>
  );
}

function AgentCell({ agent }) {
  if (!agent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>✕</span>
        </div>
        <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
        {agent.initials}
      </div>
      <span style={{ fontSize: 13, color: '#0f172a' }}>{agent.name}</span>
    </div>
  );
}

function DeadlineCell({ ticket }) {
  if (ticket.breached) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#dc2626', borderRadius: 4, padding: '8px 14px',
        height: 40,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
          EXPIRED / BREACHED BY {ticket.breachedBy}
        </span>
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>🔔</span>
      </div>
    );
  }

  const color = ticket.pctElapsed >= 85 ? '#f59e0b' : '#22c55e';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{ticket.minsLeft} minutes remaining</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{ticket.pctElapsed}% ELAPSED</span>
      </div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${ticket.pctElapsed}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function ManagerRiskQueue() {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div>
      {/* Critical System Monitor banner */}
      {!bannerDismissed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', marginBottom: 16,
          background: '#fffbeb', border: '1px solid #fde68a',
          borderLeft: '4px solid #f59e0b', borderRadius: 0,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, color: '#b45309', fontWeight: 600, flex: 1 }}>
            <strong style={{ color: '#92400e' }}>CRITICAL SYSTEM MONITOR:</strong>{' '}
            Displaying active department tickets within 1 hour of breach threshold or currently in violation.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sort bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 0' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          SORTED CHRONOLOGICALLY BY: <strong style={{ color: '#0f172a' }}>Due Date (Ascending)</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4,
            fontSize: 12, fontWeight: 700, color: '#374151',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            4 Urgent High Risk Targets
          </span>
          <button style={{ height: 32, padding: '0 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            ≡ Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['TICKET ID', 'PRIORITY TIER', 'ASSIGNED AGENT', 'RE-ROUTING DEADLINE', 'ESCALATION TARGET'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_RISK_TICKETS.map((t) => (
              <tr
                key={t.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: t.breached ? 'rgba(239,68,68,0.04)' : 'transparent',
                }}
              >
                <td style={{ padding: '16px 16px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }}>
                    #TK-{t.id}
                  </span>
                </td>
                <td style={{ padding: '16px 16px' }}>
                  <PriorityChip priority={t.priority} />
                </td>
                <td style={{ padding: '16px 16px' }}>
                  <AgentCell agent={t.agent} />
                </td>
                <td style={{ padding: '16px 16px', minWidth: 280 }}>
                  <DeadlineCell ticket={t} />
                </td>
                <td style={{ padding: '16px 16px' }}>
                  <button style={{
                    height: 34, padding: '0 14px',
                    background: '#0f172a', color: '#ffffff',
                    border: 'none', borderRadius: 6,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                    Escalate &amp; Reassign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ height: 34, padding: '0 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
            Download Risk Report
          </button>
          <button style={{ height: 34, padding: '0 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
            Bulk Reassign
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', color: '#94a3b8', cursor: 'pointer' }}>‹</button>
          <span style={{ fontSize: 12, color: '#64748b' }}>Page 1 of 1</span>
          <button style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', color: '#94a3b8', cursor: 'pointer' }}>›</button>
        </div>
      </div>
    </div>
  );
}
