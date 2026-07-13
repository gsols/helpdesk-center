/**
 * MyTicketsSidebar — collapsible "My Tickets" light panel
 *
 * Rendered inside TicketDetailPage, between the AppShell nav rail and the
 * main ticket content.
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
import { ChevronLeft, Plus, Search } from 'lucide-react';

function TicketStatusBadge({ status }) {
  const s = status?.toUpperCase() ?? '';
  let bg = '#e2e8f0', text = '#475569', label = s;

  if (s === 'IN_PROGRESS' || s === 'IN PROGRESS')      { bg = '#dbeafe'; text = '#1d4ed8'; label = 'IN PROGRESS'; }
  else if (s === 'RESOLVED')                            { bg = '#e2e8f0'; text = '#475569'; label = 'RESOLVED';    }
  else if (s === 'CLOSED')                              { bg = '#e2e8f0'; text = '#475569'; label = 'CLOSED';      }
  else if (s === 'PENDING_EMPLOYEE' || s === 'PENDING') { bg = '#fef3c7'; text = '#b45309'; label = 'PENDING';     }
  else if (s === 'OPEN')                                { bg = '#dcfce7'; text = '#15803d'; label = 'OPEN';        }

  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px',
      background: bg, color: text,
      letterSpacing: '0.05em', whiteSpace: 'nowrap',
      borderRadius: 3,
    }}>
      {label}
    </span>
  );
}

export default function MyTicketsSidebar({ activeTicketId, collapsed, onToggle, width = 280, onDragHandleMouseDown }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tickets = [] } = useTickets();
  const [search, setSearch] = useState('');

  const myTickets = tickets
    .filter(t => !user?.id || t.creator?.id === user.id)
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
        width:      collapsed ? 0 : width,
        minWidth:   collapsed ? 0 : width,
        background: '#ffffff',
        borderRight: 'none',
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
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '12px 14px',
        borderBottom:   '1px solid #e2e8f0',
        flexShrink:     0,
        background:     '#f8fafc',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#64748b',
          whiteSpace: 'nowrap',
        }}>
          My Tickets
        </span>
        <button
          onClick={onToggle}
          title="Collapse ticket list"
          style={{
            background: 'transparent', border: 'none',
            color: '#94a3b8', cursor: 'pointer',
            padding: 2, display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              fontSize: 12,
              padding: '6px 8px 6px 28px',
              outline: 'none',
              borderRadius: 4,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── New Ticket button ──────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: '#0f172a', color: '#ffffff',
            border: 'none', borderRadius: 4,
            padding: '7px 10px',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
        >
          <Plus size={13} />
          New Ticket
        </button>
      </div>

      {/* ── Ticket list ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '24px 16px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
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
                padding:     '12px 14px',
                borderBottom: '1px solid #f1f5f9',
                borderLeft:  isActive ? '3px solid #3b82f6' : '3px solid transparent',
                background:  isActive ? '#eff6ff' : 'transparent',
                cursor:      'pointer',
                transition:  'background 120ms',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isActive ? '#1d4ed8' : '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  #TK-{t.id}
                </span>
                <TicketStatusBadge status={t.status} />
              </div>
              <p style={{
                fontSize: 13, fontWeight: 500, margin: 0,
                color: isActive ? '#0f172a' : '#334155',
                lineHeight: '18px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {t.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Right drag handle ───────────────────────────────────────────── */}
      {!collapsed && (
        <div
          onMouseDown={onDragHandleMouseDown}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 5,
            cursor: 'col-resize',
            zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Drag to resize"
        >
          <div style={{
            width: 1,
            height: '100%',
            background: '#e2e8f0',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
          />
        </div>
      )}
    </aside>
  );
}
