/**
 * TeamPage — agent's department team directory.
 *
 * UI matches the design: per-agent card with full-width load bar,
 * ticket count on the right, load % below bar, legend + live clock footer.
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
  if (pct >= 80) return '#0f172a';   // high — near-black
  if (pct >= 40) return '#64748b';   // moderate — slate
  return '#cbd5e1';                  // available — light
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
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
      LATEST DATA SYNC: {now} UTC
    </span>
  );
}

export default function TeamPage() {
  const navigate         = useNavigate();
  const { user }         = useAuth();
  const { data: team = [], isLoading } = useTeam();

  return (
    <AppShell title="Team Directory">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1c30', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {user?.departmentName ?? 'Department'} Team
          </h1>
          <p style={{ fontSize: 13, color: '#76777d', margin: 0 }}>
            {isLoading ? 'Loading…' : `${team.length} agent${team.length !== 1 ? 's' : ''} in your department`}
          </p>
        </div>

        {/* ── Agent cards ───────────────────────────────────────────────── */}
        {isLoading ? (
          <div style={{ padding: '40px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            Loading team…
          </div>
        ) : team.length === 0 ? (
          <div style={{ padding: '40px 0', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            No agents found in your department.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {team.map((member, i) => {
              const isMe  = member.id === user?.id;
              const count = member.activeTicketCount;
              const pct   = Math.min(Math.round((count / MAX_LOAD) * 100), 100);
              const color = barColor(pct);
              const isLast = i === team.length - 1;

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(isMe ? '/agent' : `/agent/team/${member.id}`)}
                  style={{
                    padding: '10px 0',
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: isMe ? '#f8faff' : 'transparent',
                    transition: 'background 120ms',
                    borderRadius: 2,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isMe ? '#f8faff' : 'transparent'; }}
                >
                  {/* ── Top row: avatar / name / ticket count ──────────── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    {/* Left: avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isMe ? '#0f172a' : '#e2e8f0',
                        border: '1.5px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        color: isMe ? '#34d399' : '#64748b',
                        flexShrink: 0,
                      }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>
                            {member.name}
                          </span>
                          {isMe && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                              textTransform: 'uppercase', background: '#e0f2fe',
                              color: '#0369a1', padding: '1px 5px', borderRadius: 3,
                            }}>
                              You
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                          textTransform: 'uppercase', color: '#94a3b8',
                        }}>
                          {member.departmentName ?? 'Agent'}
                        </span>
                      </div>
                    </div>

                    {/* Right: ticket count */}
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: '#0b1c30',
                      fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
                    }}>
                      {count} Active {count === 1 ? 'Ticket' : 'Tickets'}
                    </span>
                  </div>

                  {/* ── Load bar ───────────────────────────────────────── */}
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 0, overflow: 'hidden', width: '100%', marginBottom: 5 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: color,
                      transition: 'width 300ms ease',
                    }} />
                  </div>

                  {/* ── Load % ─────────────────────────────────────────── */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}% Load</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer legend + sync ──────────────────────────────────────── */}
        {!isLoading && team.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 20, paddingTop: 14,
            borderTop: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={legendItem}>
                {legendDot('#0f172a')}
                <span style={legendLabel}>High Utility</span>
              </span>
              <span style={legendItem}>
                {legendDot('#64748b')}
                <span style={legendLabel}>Moderate</span>
              </span>
              <span style={legendItem}>
                {legendDot('#cbd5e1')}
                <span style={legendLabel}>Available</span>
              </span>
            </div>
            <LiveSync />
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ── Style constants ──────────────────────────────────────────────────────── */
const legendItem = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
};
const legendLabel = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: '#64748b',
};
