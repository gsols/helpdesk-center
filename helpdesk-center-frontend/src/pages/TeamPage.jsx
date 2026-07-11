/**
 * TeamPage — agent's department team directory
 *
 * Shows every agent in the same department with their active (OPEN / IN_PROGRESS)
 * ticket load rendered as a colour-coded progress bar.
 * Clicking "View Queue" on a row navigates to that agent's queue filtered view.
 */
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useTeam } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { ExternalLink } from 'lucide-react';

const MAX_LOAD = 10; // tickets = 100% capacity

function loadColor(pct) {
  if (pct >= 100) return '#ef4444';   // red — at capacity
  if (pct >= 70)  return '#f59e0b';   // amber — heavy
  return '#10b981';                   // green — healthy
}

function LoadBar({ count }) {
  const pct = Math.min(Math.round((count / MAX_LOAD) * 100), 100);
  const color = loadColor(pct);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 13, fontWeight: pct >= 100 ? 700 : 500,
          color: pct >= 100 ? '#ef4444' : '#0b1c30',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {count} {count === 1 ? 'ticket' : 'tickets'}
        </span>
        <span style={{ fontSize: 10, color: '#76777d' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e5eeff', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 300ms ease' }} />
      </div>
    </div>
  );
}

function AgentInitials({ name }) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function TeamPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { data: team = [], isLoading } = useTeam();

  const totalLoad  = team.reduce((s, m) => s + m.activeTicketCount, 0);
  const avgLoad    = team.length > 0 ? (totalLoad / team.length).toFixed(1) : '—';
  const available  = team.filter(m => m.activeTicketCount < MAX_LOAD).length;

  return (
    <AppShell title="Team Directory">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1c30', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              {user?.departmentName ?? 'Department'} Team
            </h1>
            <p style={{ fontSize: 13, color: '#76777d', margin: 0 }}>
              {isLoading ? 'Loading…' : `${team.length} agent${team.length !== 1 ? 's' : ''} in your department`}
            </p>
          </div>

          {/* Stats chips */}
          {!isLoading && team.length > 0 && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={statCard}>
                <span style={statLabel}>Team Avg Load</span>
                <span style={statValue}>{avgLoad}</span>
              </div>
              <div style={statCard}>
                <span style={statLabel}>Under Capacity</span>
                <span style={statValue}>{available} <span style={{ fontSize: 11, color: '#76777d', fontWeight: 400 }}>/ {team.length}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* ── Table ───────────────────────────────────────────────────── */}
        <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>

          {/* Header row */}
          <div style={headerRow}>
            <div style={{ ...headerCell, flex: 3 }}>Agent</div>
            <div style={{ ...headerCell, flex: 4 }}>Active Load</div>
            <div style={{ ...headerCell, flex: 1, textAlign: 'right' }}>Action</div>
          </div>

          {/* Body */}
          {isLoading ? (
            <div style={{ padding: '32px 24px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              Loading team…
            </div>
          ) : team.length === 0 ? (
            <div style={{ padding: '32px 24px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              No agents found in your department.
            </div>
          ) : team.map((member, i) => {
            const isMe = member.id === user?.id;
            return (
              <div
                key={member.id}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '14px 24px',
                  borderBottom: i < team.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: isMe ? '#f8faff' : 'transparent',
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => { if (!isMe) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { if (!isMe) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Agent column */}
                <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isMe ? '#0f172a' : '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: isMe ? '#34d399' : '#94a3b8',
                    flexShrink: 0, border: '1.5px solid #e2e8f0',
                  }}>
                    <AgentInitials name={member.name} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0b1c30', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.name}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: 3 }}>
                          You
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#76777d' }}>
                      {member.departmentName ?? 'Agent'}
                    </span>
                  </div>
                </div>

                {/* Load column */}
                <div style={{ flex: 4, paddingRight: 32 }}>
                  <LoadBar count={member.activeTicketCount} />
                </div>

                {/* Action column */}
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <button
                    onClick={() => navigate(`/agent/${member.id}/queue`)}
                    title={`View ${member.name}'s queue`}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#94a3b8', cursor: 'pointer',
                      padding: 6, display: 'inline-flex', alignItems: 'center',
                      borderRadius: 4, transition: 'color 120ms, background 120ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0b1c30'; e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ExternalLink size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
          Capacity bar based on {MAX_LOAD} active tickets maximum. Showing OPEN and IN_PROGRESS tickets only.
        </p>
      </div>
    </AppShell>
  );
}

/* ── Style constants ──────────────────────────────────────────────────────── */
const statCard = {
  border: '1px solid #e2e8f0', background: '#ffffff',
  padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2,
  minWidth: 110,
};
const statLabel = { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' };
const statValue = { fontSize: 18, fontWeight: 700, color: '#0b1c30', lineHeight: '24px' };

const headerRow = {
  display: 'flex', alignItems: 'center',
  padding: '10px 24px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};
const headerCell = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#64748b',
};
