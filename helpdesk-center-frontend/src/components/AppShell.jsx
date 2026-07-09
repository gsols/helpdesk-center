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
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, Settings, LogOut, Bell,
  BarChart2, Clock, ChevronLeft, ChevronRight,
  Terminal, ShieldCheck, ArchiveIcon,
} from 'lucide-react';

const SIDEBAR_KEY = 'hd_sidebar_collapsed';

/* ── Role → nav definitions ─────────────────────────────────────────────── */
const NAV = {
  employee: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Tickets',   icon: Ticket,          to: '/dashboard' },
    { label: 'Settings',  icon: Settings,        to: '/settings'  },
  ],
  agent: [
    { label: 'Queue',     icon: LayoutDashboard, to: '/agent'     },
    { label: 'Tickets',   icon: Ticket,          to: '/agent'     },
    { label: 'Analytics', icon: BarChart2,       to: '/agent'     },
    { label: 'Settings',  icon: Settings,        to: '/settings'  },
  ],
  dept_manager: [
    { label: 'Queue',      icon: LayoutDashboard, to: '/manager'  },
    { label: 'Analytics',  icon: BarChart2,       to: '/manager'  },
    { label: 'Risk Queue', icon: ShieldCheck,     to: '/manager'  },
    { label: 'Archive',    icon: ArchiveIcon,     to: '/manager'  },
    { label: 'Settings',   icon: Settings,        to: '/settings' },
  ],
  sys_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin'     },
    { label: 'Triage',    icon: Ticket,          to: '/admin'     },
    { label: 'Analytics', icon: BarChart2,       to: '/admin'     },
    { label: 'SLA',       icon: Clock,           to: '/admin'     },
    { label: 'Settings',  icon: Settings,        to: '/settings'  },
  ],
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
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

  return (
    <aside
      style={{
        width:      collapsed ? 64 : 260,
        minWidth:   collapsed ? 64 : 260,
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
        <div
          style={{
            width: 32, height: 32,
            background: '#1e293b',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Terminal size={16} color="#34d399" />
        </div>
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
          const active = pathname === item.to || pathname.startsWith(item.to + '/');
          return (
            <button
              key={item.label + item.to}
              onClick={() => navigate(item.to)}
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

      {/* ── Bottom: user profile ─────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding:   collapsed ? '12px 0' : '12px 12px',
        }}
      >
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
                {user?.role?.replace('_', ' ')}
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
              title={user?.name ?? user?.email}
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

      {/* ── Collapse toggle ───────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position:   'absolute',
          top:        '50%',
          right:      -12,
          transform:  'translateY(-50%)',
          width:      24,
          height:     24,
          borderRadius: '50%',
          background: '#1e293b',
          border:     '1px solid rgba(255,255,255,0.12)',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor:     'pointer',
          color:      '#94a3b8',
          zIndex:     60,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}

/* ── Top Header ──────────────────────────────────────────────────────────── */
function TopHeader({ title, sidebarWidth }) {
  const { user } = useAuth();
  const initials = getInitials(user?.name ?? user?.email);
  const { pathname } = useLocation();

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = ['Helpdesk', ...segments.map(s =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
  )];
  if (title && crumbs.length > 0) crumbs[crumbs.length - 1] = title;

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
export default function AppShell({ title = 'Support Engine', children, noPadding = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true'
  );

  const sidebarWidth = collapsed ? 64 : 260;

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
        <TopHeader title={title} sidebarWidth={sidebarWidth} />

        <main style={{ flex: 1, overflowY: noPadding ? 'hidden' : 'auto', paddingTop: 48, display: noPadding ? 'flex' : 'block', flexDirection: 'column' }}>
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
