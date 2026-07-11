/**
 * ManagerRiskQueue — Wired to GET /api/tickets/risk-queue
 *
 * Shows active dept tickets that are:
 *   - Already breached  (dueAt < now)
 *   - Near-breach       (dueAt within 60 minutes)
 *
 * Rows are sorted by dueAt ascending (soonest deadline first, server-side).
 * Columns: TICKET ID | PRIORITY TIER | ASSIGNED AGENT | RE-ROUTING DEADLINE | ESCALATION TARGET
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiskQueue } from '../hooks/useTickets';
import { useQueryClient } from '@tanstack/react-query';

/* ── helpers ────────────────────────────────────────────────────────────── */
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/* ── sub-components ─────────────────────────────────────────────────────── */
function PriorityChip({ priority }) {
  const p  = (priority ?? 'MEDIUM').toUpperCase();
  const isC = p === 'CRITICAL';
  const isH = p === 'HIGH';
  const bg    = isC ? '#fef2f2' : isH ? '#fff7ed' : '#fffbeb';
  const border = isC ? '#fecaca' : isH ? '#fed7aa' : '#fde68a';
  const color  = isC ? '#dc2626' : isH ? '#c2410c' : '#b45309';
  return (
    <span style={{
      padding: '3px 10px',
      background: bg, border: `1px solid ${border}`,
      borderRadius: 4, fontSize: 11, fontWeight: 700, color,
    }}>
      {p}
    </span>
  );
}

function AgentCell({ assignee }) {
  if (!assignee) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>–</span>
        </div>
        <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
        {initials(assignee.name)}
      </div>
      <span style={{ fontSize: 13, color: '#0f172a' }}>{assignee.name}</span>
    </div>
  );
}

function DeadlineCell({ ticket, now }) {
  if (!ticket.dueAt) {
    return <span style={{ fontSize: 12, color: '#94a3b8' }}>No SLA</span>;
  }

  const due     = new Date(ticket.dueAt).getTime();
  const created = new Date(ticket.createdAt).getTime();
  const total   = Math.max(due - created, 1);
  const pctElapsed = Math.min(100, Math.round(((now - created) / total) * 100));

  if (due < now) {
    const overMins = Math.round((now - due) / 60000);
    const overHrs  = Math.floor(overMins / 60);
    const overMin  = overMins % 60;
    const label    = overHrs > 0 ? `${overHrs}H ${overMin}M` : `${overMins}M`;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#dc2626', borderRadius: 4, padding: '8px 14px', height: 40,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
          EXPIRED / BREACHED BY {label}
        </span>
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)' }}>🔔</span>
      </div>
    );
  }

  const minsLeft = Math.max(0, Math.round((due - now) / 60000));
  const barColor = pctElapsed >= 85 ? '#f59e0b' : '#22c55e';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{minsLeft} minutes remaining</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{pctElapsed}% ELAPSED</span>
      </div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pctElapsed}%`, background: barColor, borderRadius: 2 }} />
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────────── */
export default function ManagerRiskQueue() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useRiskQueue();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  /* `now` is memoised at mount — component re-renders every 60 s via the query's refetchInterval */
  const [now] = useState(() => Date.now());

  const breachedCount  = tickets.filter(t => t.dueAt && new Date(t.dueAt).getTime() < now).length;
  const nearBreachCount = tickets.filter(t => {
    if (!t.dueAt) return false;
    const due = new Date(t.dueAt).getTime();
    return due >= now && due - now <= 60 * 60 * 1000;
  }).length;

  const handleRefresh = () => qc.invalidateQueries({ queryKey: ['tickets', 'risk-queue'] });

  return (
    <div>
      {/* ── Critical banner ──────────────────────────────────────────── */}
      {!bannerDismissed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', marginBottom: 16,
          background: '#fffbeb', border: '1px solid #fde68a',
          borderLeft: '4px solid #f59e0b',
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, color: '#b45309', fontWeight: 600, flex: 1 }}>
            <strong style={{ color: '#92400e' }}>CRITICAL SYSTEM MONITOR:</strong>{' '}
            Displaying active department tickets within 1 hour of breach threshold or currently in violation.
          </span>
          <button onClick={() => setBannerDismissed(true)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── Sort bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 0' }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          SORTED CHRONOLOGICALLY BY: <strong style={{ color: '#0f172a' }}>Due Date (Ascending)</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {tickets.length > 0 && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4,
              fontSize: 12, fontWeight: 700, color: '#374151',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              {breachedCount} Breached · {nearBreachCount} Near-Breach
            </span>
          )}
          <button
            onClick={handleRefresh}
            style={{ height: 32, padding: '0 12px', background: '#0f172a', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Ticket ID', 'Priority Tier', 'Assigned Agent', 'Re-Routing Deadline', 'Escalation Target'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Loading risk queue…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                    </svg>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>All Clear</span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>No tickets are breached or near-breach in your department.</span>
                  </div>
                </td>
              </tr>
            ) : tickets.map((t) => {
              const isBreached = t.dueAt && new Date(t.dueAt).getTime() < now;
              return (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: isBreached ? 'rgba(239,68,68,0.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isBreached ? 'rgba(239,68,68,0.08)' : '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isBreached ? 'rgba(239,68,68,0.04)' : 'transparent'; }}
                >
                  <td style={{ padding: '16px' }}>
                    <span
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }}
                    >
                      #TK-{t.id}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <PriorityChip priority={t.priority} />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <AgentCell assignee={t.assignee} />
                  </td>
                  <td style={{ padding: '16px', minWidth: 280 }}>
                    <DeadlineCell ticket={t} now={now} />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => navigate('/manager')}
                      style={{
                        height: 34, padding: '0 14px',
                        background: '#0f172a', color: '#ffffff',
                        border: 'none', borderRadius: 6,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                    >
                      Escalate &amp; Reassign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {isLoading ? 'Loading…' : `${tickets.length} at-risk ticket${tickets.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            {breachedCount} Breached
          </span>
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            {nearBreachCount} Near-Breach
          </span>
        </div>
      </div>
    </div>
  );
}
