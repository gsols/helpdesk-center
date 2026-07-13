/**
 * NotificationPanel — bell-icon dropdown for all roles.
 *
 * Filter tabs:
 *   All Feed   → every notification
 *   Unread Only → n.read === false
 *   System Flags → type SYSTEM | SLA_BREACH | TAKEOVER_APPROVAL_REQUEST  (DEPT_MANAGER + SYS_ADMIN only)
 *
 * Click a row:
 *   - Standard:                   mark read + navigate to /tickets/:ticketId
 *   - TAKEOVER_APPROVAL_REQUEST:  mark read + open TicketInspectionDrawer with Approve/Reject footer
 * "Mark all as read" → PATCH mark-all-read
 * "View full history" → TODO: route to a dedicated /notifications page (future)
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import TicketInspectionDrawer from './TicketInspectionDrawer';

const SYSTEM_TYPES = ['SLA_BREACH', 'SYSTEM', 'TAKEOVER_APPROVAL_REQUEST'];

/** Returns a human-relative time string, e.g. "5 mins ago", "2 hrs ago". */
function relativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

export default function NotificationPanel() {
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState('all');
  const panelRef          = useRef(null);

  /* Takeover-approval drawer state */
  const [takeoverDrawerTicketId, setTakeoverDrawerTicketId] = useState(null);

  const { notifications, unreadCount, loading, fetchAll, markRead, markAllRead } =
    useNotifications();

  /* Determine which tabs this role can see */
  const canSeeSystemFlags =
    user?.role === 'dept_manager' || user?.role === 'sys_admin';

  /* Open/close panel and fetch on open */
  const handleBellClick = () => {
    if (!open) fetchAll();
    setOpen((v) => !v);
  };

  /* Close on outside click — but NOT when the takeover drawer is open */
  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  /* Filtered list based on active tab */
  const filtered = notifications.filter((n) => {
    if (tab === 'unread')  return !n.read;
    if (tab === 'system')  return SYSTEM_TYPES.includes(n.type);
    return true; // 'all'
  });

  /* Click on a notification row */
  const handleRowClick = async (n) => {
    if (!n.read) await markRead(n.id);
    setOpen(false);

    if (n.type === 'TAKEOVER_APPROVAL_REQUEST' && n.ticketId) {
      /* Intercept — open inspection drawer with Approve/Reject actions */
      setTakeoverDrawerTicketId(n.ticketId);
      return;
    }

    if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* ── Bell button ───────────────────────────────────────────────────── */}
      <button
        onClick={handleBellClick}
        title="Notifications"
        style={{
          position:   'relative',
          background: 'transparent',
          border:     'none',
          color:      open ? '#1f2328' : '#76777d',
          cursor:     'pointer',
          padding:    4,
          borderRadius: 6,
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1f2328'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = '#76777d'; }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position:   'absolute',
            top:        0,
            right:      0,
            width:      16,
            height:     16,
            borderRadius: '50%',
            background: '#3b82d4',
            color:      '#fff',
            fontSize:   9,
            fontWeight: 700,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            border:     '1.5px solid #ffffff',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 8px)',
          right:        0,
          width:        360,
          background:   '#ffffff',
          border:       '1px solid #e5e7eb',
          borderRadius: 10,
          boxShadow:    '0 4px 24px rgba(0,0,0,0.10)',
          zIndex:       200,
          overflow:     'hidden',
        }}>

          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '14px 16px 10px',
            borderBottom:   '1px solid #f0f0f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1f2328' }}>
                Activity Feed
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#3b82d4',
                  color:      '#fff',
                  fontSize:   11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding:    '1px 7px',
                  lineHeight: '18px',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              style={{
                background:   'none',
                border:       'none',
                fontSize:     12,
                color:        '#3b82d4',
                cursor:       'pointer',
                fontWeight:   500,
                padding:      0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              Mark all as read
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{
            display:    'flex',
            gap:        4,
            padding:    '8px 12px 4px',
            borderBottom: '1px solid #f0f0f0',
          }}>
            {[
              { key: 'all',    label: 'All Feed'    },
              { key: 'unread', label: 'Unread Only' },
              ...(canSeeSystemFlags
                ? [{ key: 'system', label: 'System Flags' }]
                : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  fontSize:     12,
                  fontWeight:   tab === key ? 600 : 400,
                  color:        tab === key ? '#1f2328' : '#57606a',
                  background:   tab === key ? '#f0f4f8' : 'transparent',
                  border:       '1px solid',
                  borderColor:  tab === key ? '#d0d7de' : 'transparent',
                  borderRadius: 20,
                  padding:      '4px 12px',
                  cursor:       'pointer',
                  transition:   'background 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  if (tab !== key) {
                    e.currentTarget.style.background = '#f6f8fa';
                    e.currentTarget.style.color = '#1f2328';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#57606a';
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Notification rows */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#57606a', fontSize: 13 }}>
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#57606a', fontSize: 13 }}>
                No notifications here.
              </div>
            ) : (
              filtered.map((n) => (
                <NotificationRow key={n.id} n={n} onClick={handleRowClick} />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            borderTop:  '1px solid #f0f0f0',
            padding:    '10px 16px',
            textAlign:  'center',
          }}>
            <button
              style={{
                background: 'none',
                border:     'none',
                color:      '#57606a',
                fontSize:   12,
                cursor:     'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1f2328'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#57606a'; }}
            >
              View full history
            </button>
          </div>
        </div>
      )}

      {/* ── Takeover approval overlay — triggered by TAKEOVER_APPROVAL_REQUEST row click ── */}
      {takeoverDrawerTicketId && (
        <TakeoverApprovalOverlay
          ticketId={takeoverDrawerTicketId}
          onClose={() => setTakeoverDrawerTicketId(null)}
        />
      )}
    </div>
  );
}

/* ── Takeover Approval Overlay ───────────────────────────────────────────── */
/**
 * Full-screen overlay that renders the TicketInspectionDrawer with
 * showTakeoverActions=true when the manager clicks a TAKEOVER_APPROVAL_REQUEST row.
 */
function TakeoverApprovalOverlay({ ticketId, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500,
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 520, maxHeight: '90vh',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Drawer title bar */}
        <div style={{
          padding: '10px 16px',
          background: '#0f172a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Takeover Approval Request
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <TicketInspectionDrawer
            selectedTicketId={ticketId}
            isManager={true}
            hideTakeOver={false}
            showTakeoverActions={true}
            onTakeoverActioned={onClose}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Single row ──────────────────────────────────────────────────────────── */
function NotificationRow({ n, onClick }) {
  const isSystem = SYSTEM_TYPES.includes(n.type);

  return (
    <div
      onClick={() => onClick(n)}
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          10,
        padding:      '11px 16px',
        borderBottom: '1px solid #f3f4f6',
        cursor:       n.ticketId ? 'pointer' : 'default',
        background:   'transparent',
        transition:   'background 120ms',
      }}
      onMouseEnter={(e) => {
        if (n.ticketId) e.currentTarget.style.background = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Unread dot / system icon */}
      <div style={{ width: 20, paddingTop: 3, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        {isSystem ? (
          <span style={{ fontSize: 14 }}>⚠️</span>
        ) : !n.read ? (
          <span style={{
            width:        8,
            height:       8,
            borderRadius: '50%',
            background:   '#3b82d4',
            display:      'inline-block',
            marginTop:    3,
          }} />
        ) : (
          <span style={{ width: 8, height: 8, display: 'inline-block' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:   13,
          color:      '#1f2328',
          fontWeight: n.read ? 400 : 500,
          lineHeight: '1.4',
          wordBreak:  'break-word',
        }}>
          <MessageWithTicketLink message={n.message} />
        </div>
        <div style={{ fontSize: 11, color: '#57606a', marginTop: 3 }}>
          {relativeTime(n.createdAt)}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the notification message and turns "TCK-{id}" references into
 * visually distinct inline spans (matching the reference image's blue mono style).
 */
function MessageWithTicketLink({ message }) {
  if (!message) return null;
  const parts = message.split(/(TCK-\d+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^TCK-\d+$/.test(part) ? (
          <span key={i} style={{
            fontFamily:  'monospace',
            color:       '#3b82d4',
            fontWeight:  600,
            fontSize:    13,
          }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
