/**
 * TeamPage — agent's department team directory.
 *
 * Compact table layout: avatar + name | role | active tickets | load bar | load %
 */
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useTeam } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';

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
      width: 7, height: 7, borderRadius: '50%',
      background: color, display: 'inline-block', flexShrink: 0,
    }} />
  );
}

function LiveSync() {
  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
      LATEST DATA SYNC: {now} UTC
    </span>
  );
}

export default function TeamPage() {
  const navigate               = useNavigate();
  const { user }               = useAuth();
  const { data: team = [], isLoading } = useTeam();

  return (
    <AppShell title="Team Directory">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1c30', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {user?.departmentName ?? 'Department'} Team
          </h1>
          <p style={{ fontSize: 13, color: '#76777d', margin: 0 }}>
            {isLoading ? 'Loading…' : `${team.length} agent${team.length !== 1 ? 's' : ''} in your department`}
          </p>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div style={{ padding: '40px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            Loading team…
          </div>
        ) : team.length === 0 ? (
          <div style={{ padding: '40px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            No agents found in your department.
          </div>
        ) : (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 130px 100px 160px 56px',
              padding: '7px 16px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}>
              {['Agent', 'Role', 'Active', 'Load', ''].map((col, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: '#94a3b8',
                  textAlign: i >= 2 ? 'center' : 'left',
                }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {team.map((member, i) => {
              const isMe   = member.id === user?.id;
              const count  = member.activeTicketCount;
              const pct    = Math.min(Math.round((count / MAX_LOAD) * 100), 100);
              const color  = barColor(pct);
              const isLast = i === team.length - 1;

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(isMe ? '/agent' : `/agent/team/${member.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 130px 100px 160px 56px',
                    padding: '8px 16px',
                    alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                    background: isMe ? '#f8faff' : '#fff',
                    cursor: 'pointer',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isMe ? '#f8faff' : '#fff'; }}
                >
                  {/* Agent name + avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: isMe ? '#0f172a' : '#e2e8f0',
                      border: '1.5px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                      color: isMe ? '#34d399' : '#64748b',
                    }}>
                      {initials(member.name)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0b1c30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.name}
                    </span>
                    {isMe && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', background: '#e0f2fe',
                        color: '#0369a1', padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                      }}>
                        You
                      </span>
                    )}
                  </div>

                  {/* Role / dept */}
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {member.departmentName ?? 'Agent'}
                  </span>

                  {/* Active ticket count */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0b1c30', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
                    {count}
                  </span>

                  {/* Load bar */}
                  <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 300ms ease' }} />
                  </div>

                  {/* Load % */}
                  <span style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer legend + sync ────────────────────────────────────────── */}
        {!isLoading && team.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 14, paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={legendItem}>{legendDot('#0f172a')}<span style={legendLabel}>High Utility</span></span>
              <span style={legendItem}>{legendDot('#64748b')}<span style={legendLabel}>Moderate</span></span>
              <span style={legendItem}>{legendDot('#cbd5e1')}<span style={legendLabel}>Available</span></span>
            </div>
            <LiveSync />
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ── Style constants ──────────────────────────────────────────────────────── */
const legendItem  = { display: 'inline-flex', alignItems: 'center', gap: 5 };
const legendLabel = { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748b' };
