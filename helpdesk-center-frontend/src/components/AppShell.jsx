/**
 * AppShell — Technical Support Enterprise shell
 *
 * Sidebar: collapsible 260px (expanded, labeled) ↔ 64px (collapsed, icons-only)
 * Persisted to localStorage key "hd_sidebar_collapsed"
 * Smooth CSS transition-[width] duration-200
 *
 * Nav rail: bg-slate-950 (#020617)
 * Active item: border-l-[3px] border-emerald-400 bg-white/5 text-white
 * Inactive item: text-slate-400 hover:text-white hover:bg-white/5
 *
 * Header: 48px, bg-white, border-b border-slate-200
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import {
  LayoutDashboard, Ticket, Settings, LogOut, Bell,
  BarChart2, Clock,
  Menu, ShieldCheck, ArchiveIcon, Users,
} from 'lucide-react';

const SIDEBAR_KEY = 'hd_sidebar_collapsed';

/* ── Role → nav definitions ─────────────────────────────────────────────── */
const NAV = {
  employee: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Tickets',   icon: Ticket,          to: '/tickets'   },
  ],
  agent: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/agent',      exact: true },
    { label: 'Team',      icon: Users,           to: '/agent/team'              },
  ],
  dept_manager: [
    { label: 'Queue',      icon: LayoutDashboard, to: '/manager'  },
    { label: 'Tickets',    icon: Ticket,          to: '/tickets'  },
    { label: 'Analytics',  icon: BarChart2,       to: '/manager'  },
    { label: 'Risk Queue', icon: ShieldCheck,     to: '/manager'  },
    { label: 'Archive',    icon: ArchiveIcon,     to: '/manager'  },
  ],
  sys_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin'     },
    { label: 'Tickets',   icon: Ticket,          to: '/tickets'   },
    { label: 'Triage',    icon: Clock,           to: '/admin'     },
    { label: 'Analytics', icon: BarChart2,       to: '/admin'     },
    { label: 'SLA',       icon: ShieldCheck,     to: '/admin'     },
  ],
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Role subtitle: agents get "Agent · <Department>", others get the role label. */
function roleSubtitle(user) {
  if (!user) return '';
  const base = user.role?.replace(/_/g, ' ') ?? '';
  if ((user.role === 'agent' || user.role === 'AGENT') && user.departmentName) {
    return `${base} · ${user.departmentName}`;
  }
  return base;
}

/* ── Live clock ──────────────────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[12px] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 select-none tabular-nums">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  );
}

/* ── Network Offline Banner ──────────────────────────────────────────────── */
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-xs font-bold px-4 py-1.5 flex items-center justify-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
      Network offline — SLA sync temporarily paused. Reconnecting…
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ user, collapsed, onToggle, onLogout }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navItems = NAV[user?.role] ?? [];
  const initials = getInitials(user?.name ?? user?.email);

  // Pre-fetch tickets so we can navigate directly to the first one
  // without going through TicketsIndexPage (which causes a double-navigate blink)
  const { data: tickets = [] } = useTickets();
  const firstTicketId = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.id ?? null;

  return (
    <aside
      style={{
        width:      collapsed ? 64 : 180,
        minWidth:   collapsed ? 64 : 180,
        background: '#020617',
        borderRight: 'none',
        display:    'flex',
        flexDirection: 'column',
        position:   'fixed',
        left:       0,
        top:        0,
        bottom:     0,
        zIndex:     50,
        transition: 'width 200ms ease-in-out, min-width 200ms ease-in-out',
        overflow:   'hidden',
      }}
    >
      {/* ── Brand header ──────────────────────────────────────────────── */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         10,
          padding:     collapsed ? '14px 0' : '14px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
          minHeight:   56,
          flexShrink:  0,
        }}
      >
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 32, height: 32,
            background: '#1e293b',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; }}
        >
          <Menu size={16} color="#94a3b8" />
        </button>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', lineHeight: '18px', whiteSpace: 'nowrap' }}>
              Support Engine
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? user?.email ?? 'ALPHA'}
            </div>
          </div>
        )}
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: collapsed ? '4px 0' : '4px 8px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + '/');
          const handleNavClick = () => {
            if (active && item.to === '/tickets') {
              // Already on tickets — toggle the sidebar instead of re-navigating
              window.dispatchEvent(new CustomEvent('tickets-tab-click'));
            } else if (item.to === '/tickets' && firstTicketId) {
              // Navigate directly to the first ticket — skip the /tickets redirect hop
              navigate(`/tickets/${firstTicketId}`);
            } else {
              navigate(item.to);
            }
          };
          return (
            <button
              key={item.label + item.to}
              onClick={handleNavClick}
              title={collapsed ? item.label : undefined}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                gap:            collapsed ? 0 : 10,
                padding:        collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background:     active ? 'rgba(255,255,255,0.06)' : 'transparent',
                border:         'none',
                borderLeft:     active ? '3px solid #34d399' : '3px solid transparent',
                borderRadius:   active && !collapsed ? '0 6px 6px 0' : 0,
                color:          active ? '#ffffff' : 'rgba(148,163,184,1)',
                fontSize:       13,
                fontWeight:     active ? 600 : 400,
                cursor:         'pointer',
                transition:     'background 150ms, color 150ms',
                whiteSpace:     'nowrap',
                overflow:       'hidden',
                marginBottom:   2,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(148,163,184,1)';
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom: Settings + user profile ──────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding:   collapsed ? '8px 0' : '8px 8px',
        }}
      >
        {/* Settings button — same style as nav items */}
        {(() => {
          const active = pathname === '/settings' || pathname.startsWith('/settings/');
          return (
            <button
              onClick={() => navigate('/settings')}
              title={collapsed ? 'Settings' : undefined}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                gap:            collapsed ? 0 : 10,
                padding:        collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background:     active ? 'rgba(255,255,255,0.06)' : 'transparent',
                border:         'none',
                borderLeft:     active ? '3px solid #34d399' : '3px solid transparent',
                borderRadius:   active && !collapsed ? '0 6px 6px 0' : 0,
                color:          active ? '#ffffff' : 'rgba(148,163,184,1)',
                fontSize:       13,
                fontWeight:     active ? 600 : 400,
                cursor:         'pointer',
                transition:     'background 150ms, color 150ms',
                whiteSpace:     'nowrap',
                overflow:       'hidden',
                marginBottom:   6,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(148,163,184,1)';
                }
              }}
            >
              <Settings size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Settings</span>}
            </button>
          );
        })()}

        {!collapsed ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#1e293b',
                border: '1.5px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? user?.email}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(100,116,139,1)', lineHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {roleSubtitle(user)}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{ background: 'transparent', border: 'none', color: 'rgba(100,116,139,1)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(100,116,139,1)'; }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#1e293b',
                border: '1.5px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
              }}
              title={`${user?.name ?? user?.email}${user?.departmentName ? ` · ${user.departmentName}` : ''}`}
            >
              {initials}
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{ background: 'transparent', border: 'none', color: 'rgba(100,116,139,1)', cursor: 'pointer', padding: 4 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(100,116,139,1)'; }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}

/* ── Top Header ──────────────────────────────────────────────────────────── */
function TopHeader({ title, sidebarWidth, panelToggle, panelCollapsed }) {
  const { user } = useAuth();
  const initials = getInitials(user?.name ?? user?.email);
  const { pathname } = useLocation();

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = ['Helpdesk', ...segments.map(s =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
  )];
  if (title && crumbs.length > 0) {
    const isAgent = user?.role === 'agent' || user?.role === 'AGENT';
    crumbs[crumbs.length - 1] = isAgent && user?.departmentName
      ? `${user.departmentName} ${title}`
      : title;
  }

  return (
    <header
      style={{
        position:    'fixed',
        top:         0,
        left:        sidebarWidth,
        right:       0,
        height:      48,
        background:  '#ffffff',
        borderBottom:'1px solid #e2e8f0',
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'space-between',
        padding:     '0 20px',
        zIndex:      40,
        transition:  'left 200ms ease-in-out',
      }}
    >
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, minWidth: 0, flex: 1 }}>
        {panelToggle && (
          <button
            onClick={panelToggle}
            title={panelCollapsed ? 'Expand panel' : 'Collapse panel'}
            style={{
              background: panelCollapsed ? '#f1f5f9' : 'transparent',
              border: '1px solid',
              borderColor: panelCollapsed ? '#cbd5e1' : 'transparent',
              borderRadius: 5,
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: panelCollapsed ? '#334155' : '#94a3b8',
              marginRight: 4,
              flexShrink: 0,
              transition: 'background 150ms, border-color 150ms, color 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = panelCollapsed ? '#f1f5f9' : 'transparent'; e.currentTarget.style.borderColor = panelCollapsed ? '#cbd5e1' : 'transparent'; e.currentTarget.style.color = panelCollapsed ? '#334155' : '#94a3b8'; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </button>
        )}
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {i > 0 && <span style={{ color: '#94a3b8', fontSize: 12 }}>›</span>}
            <span style={{
              fontWeight:   i === crumbs.length - 1 ? 600 : 400,
              color:        i === crumbs.length - 1 ? '#0b1c30' : '#76777d',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {user?.companyId && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            Tenant #{user.companyId}
          </span>
        )}
        <LiveClock />
        <button style={{ background: 'transparent', border: 'none', color: '#76777d', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
          <Bell size={18} />
        </button>
        <div
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#94a3b8',
            cursor: 'pointer', border: '1.5px solid #e2e8f0',
            flexShrink: 0,
          }}
          title={user?.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

/* ── AppShell ─────────────────────────────────────────────────────────────── */
export default function AppShell({ title = 'Support Engine', children, noPadding = false, panelToggle, panelCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true'
  );

  // Fade the content area on route change — no unmount, no white flash
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(5px)';
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  const sidebarWidth = collapsed ? 64 : 180;

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#f8f9ff', display: 'flex' }}>
      <OfflineBanner />

      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggle={handleToggle}
        onLogout={handleLogout}
      />

      <div
        style={{
          flex:          1,
          marginLeft:    sidebarWidth,
          display:       'flex',
          flexDirection: 'column',
          minWidth:      0,
          transition:    'margin-left 200ms ease-in-out',
        }}
      >
        <TopHeader title={title} sidebarWidth={sidebarWidth} panelToggle={panelToggle} panelCollapsed={panelCollapsed} />

        <main
          ref={mainRef}
          style={{
            flex: 1, overflowY: noPadding ? 'hidden' : 'auto', paddingTop: 48,
            display: noPadding ? 'flex' : 'block', flexDirection: 'column',
            opacity: 1, transform: 'translateY(0)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        >
          {noPadding ? children : (
            <div style={{ padding: '24px' }}>
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
