/**
 * MyTicketsSidebar — collapsible "My Tickets" dark panel
 *
 * Rendered inside TicketDetailPage, between the AppShell nav rail and the
 * main ticket content. Styled to match the employee_ticket_detail_refined_layout
 * wireframe (dark background, search, ticket cards with status badges).
 *
 * Props:
 *   activeTicketId — currently viewed ticket id (marks that card as active)
 *   collapsed      — whether the panel is collapsed
 *   onToggle       — callback to toggle collapsed state
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { ChevronLeft, Search } from 'lucide-react';

function TicketStatusBadge({ status }) {
  const s = status?.toUpperCase() ?? '';
  let bg = '#45464d', text = '#fff', label = s;

  if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') { bg = '#d3e4fe'; text = '#0b1c30'; label = 'IN PROGRESS'; }
  else if (s === 'RESOLVED' || s === 'CLOSED')     { bg = '#5c5f61'; text = '#fff';    label = s;            }
  else if (s === 'PENDING')                         { bg = '#f59e0b'; text = '#fff';    label = 'PENDING';    }
  else if (s === 'OPEN')                            { bg = '#1e293b'; text = '#fff';    label = 'OPEN';       }

  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px',
      background: bg, color: text,
      letterSpacing: '0.05em', whiteSpace: 'nowrap',
      borderRadius: 0,
    }}>
      {label}
    </span>
  );
}

export default function MyTicketsSidebar({ activeTicketId, collapsed, onToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tickets = [] } = useTickets();
  const [search, setSearch] = useState('');

  const myTickets = tickets
    .filter(t => !user?.id || t.reporterId === user.id || t.createdById === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filtered = search.trim()
    ? myTickets.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        String(t.id).includes(search)
      )
    : myTickets;

  return (
    <aside
      style={{
        width:      collapsed ? 0 : 300,
        minWidth:   collapsed ? 0 : 300,
        background: '#0b1c30',
        borderRight:'1px solid rgba(255,255,255,0.08)',
        display:    'flex',
        flexDirection: 'column',
        overflow:   'hidden',
        transition: 'width 200ms ease-in-out, min-width 200ms ease-in-out',
        flexShrink: 0,
        position:   'relative',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'space-between',
        padding:     '14px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        flexShrink:  0,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
          whiteSpace: 'nowrap',
        }}>
          My Tickets
        </span>
        <button
          onClick={onToggle}
          title="Collapse ticket list"
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            padding: 2, display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 12, padding: '6px 8px 6px 28px',
              outline: 'none', borderRadius: 0, boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Ticket list ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '24px 16px', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            No tickets found
          </div>
        )}
        {filtered.map((t) => {
          const isActive = String(t.id) === String(activeTicketId);
          return (
            <div
              key={t.id}
              onClick={() => navigate(`/tickets/${t.id}`)}
              style={{
                padding:     '14px 16px',
                borderBottom:'1px solid rgba(255,255,255,0.06)',
                borderLeft:  isActive ? '4px solid #ffffff' : '4px solid transparent',
                background:  isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                cursor:      'pointer',
                transition:  'background 120ms',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isActive ? '#bec6e0' : 'rgba(255,255,255,0.4)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  #{t.id}
                </span>
                <TicketStatusBadge status={t.status} />
              </div>
              <p style={{
                fontSize: 13, fontWeight: 500, margin: 0,
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                lineHeight: '18px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {t.title}
              </p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
