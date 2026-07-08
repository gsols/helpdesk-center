/**
 * AppShell (ui-ux-blueprint.md §1)
 *
 * Viewport-locked shell wrapping all authenticated screens.
 * Layout:
 *   Left Primary Navigation Rail (fixed 64px collapsed / 240px expanded)
 *   Top Application Header (fixed 56px height)
 *     - Left: Breadcrumb navigation string
 *     - Right: Tenant Context Indicator Badge + Live Clock + avatar
 *
 * Design rules (ADR-0006):
 *   Structural containers → rounded-none
 *   Interactive widgets (avatar, buttons) → rounded / rounded-full
 *
 * Also renders:
 *   Network Offline Warning Banner (ui-ux-blueprint §3)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { T } from '../styles/tokens';
import {
  Headphones, LayoutDashboard, Ticket,
  Settings, LogOut, Menu, X, Bell,
} from 'lucide-react';

/* ── Role → nav definitions ─────────────────────────────────────────────── */
const NAV = {
  employee: [
    { label: 'My Tickets', icon: Ticket,          to: '/dashboard' },
    { label: 'Settings',   icon: Settings,        to: '/settings'  },
  ],
  agent: [
    { label: 'Queue',      icon: LayoutDashboard, to: '/agent'     },
    { label: 'Settings',   icon: Settings,        to: '/settings'  },
  ],
  dept_manager: [
    { label: 'Queue',      icon: LayoutDashboard, to: '/agent'     },
    { label: 'Admin',      icon: Settings,        to: '/admin'     },
    { label: 'Settings',   icon: Settings,        to: '/settings'  },
  ],
  sys_admin: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/admin'     },
    { label: 'Settings',   icon: Settings,        to: '/settings'  },
  ],
};

const ROLE_LABELS = {
  employee:     'Employee',
  agent:        'Support Agent',
  dept_manager: 'Dept. Manager',
  sys_admin:    'System Admin',
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
    <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums select-none">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  );
}

/* ── Network Offline Banner ──────────────────────────────────────────────── */
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    // Thin warning banner — structural, rounded-none (ADR-0006 §1)
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
      Network offline — SLA sync temporarily paused. Reconnecting…
    </div>
  );
}

/* ── NavItem ─────────────────────────────────────────────────────────────── */
function NavItem({ item, active, collapsed }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? item.label : undefined}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        width:          '100%',
        padding:        collapsed ? '10px 0' : '10px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background:     active ? T.navyDark : hovered ? T.navyMid : 'transparent',
        border:         'none',
        borderRadius:   0,
        cursor:         'pointer',
        color:          active ? '#ffffff' : T.sidebarText,
        fontSize:       13,
        fontWeight:     active ? 600 : 400,
        borderLeft:     active ? `3px solid ${T.accent}` : '3px solid transparent',
        transition:     'background 0.12s, color 0.12s',
        textAlign:      'left',
      }}
    >
      <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ user, onLogout, collapsed, onToggle }) {
  const { pathname } = useLocation();
  const navItems  = NAV[user?.role] ?? [];
  const initials  = getInitials(user?.name ?? user?.email);
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? '';

  return (
    <aside style={{
      position:      'fixed',
      top:           0,
      left:          0,
      height:        '100vh',
      width:         collapsed ? 64 : T.sidebarWidth,
      background:    T.navy,
      display:       'flex',
      flexDirection: 'column',
      zIndex:        40,
      transition:    'width 0.2s ease',
      overflowX:     'hidden',
    }}>
      {/* Logo row */}
      <div style={{
        height:         T.topBarHeight,
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding:        collapsed ? 0 : '0 14px',
        borderBottom:   `1px solid rgba(255,255,255,0.08)`,
        flexShrink:     0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            {/* Logo icon — structural, rounded-none */}
            <div style={{
              width: 32, height: 32, borderRadius: 0,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Headphones size={17} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              Helpdesk <span style={{ color: T.accentLight }}>Center</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 32, height: 32, borderRadius: 0,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Headphones size={17} color="#ffffff" strokeWidth={2.5} />
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.sidebarText, display: 'flex', alignItems: 'center',
            padding: 4, borderRadius: 0, flexShrink: 0,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{
        flex: 1, padding: collapsed ? '12px 8px' : '12px 10px',
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
      }}>
        {navItems.map(item => (
          <NavItem
            key={item.label + item.to}
            item={item}
            active={pathname === item.to}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* User section — avatar uses rounded-full (circular, ADR-0006 §2) */}
      <div style={{
        borderTop: `1px solid rgba(255,255,255,0.08)`,
        padding:   collapsed ? '12px 8px' : '14px 12px',
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? user?.email}
              </div>
              <div style={{ fontSize: 11, color: T.sidebarMuted, textTransform: 'capitalize' }}>{roleLabel}</div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sidebarMuted, display: 'flex', padding: 4, borderRadius: 0, flexShrink: 0 }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {initials}
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sidebarMuted, display: 'flex', padding: 4, borderRadius: 0 }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Breadcrumb ──────────────────────────────────────────────────────────── */
function Breadcrumb({ title }) {
  const { pathname } = useLocation();

  // Build crumb segments from the path
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = ['Helpdesk', ...segments.map(s =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
  )];
  // Replace last crumb with the provided title if it exists
  if (title && crumbs.length > 0) crumbs[crumbs.length - 1] = title;

  return (
    <nav className="flex items-center gap-1 text-xs select-none overflow-hidden min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && (
            <span className="text-slate-300 dark:text-slate-600 shrink-0">/</span>
          )}
          <span className={[
            'truncate',
            i === crumbs.length - 1
              ? 'font-semibold text-slate-800 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500',
          ].join(' ')}>
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}

/* ── TopBar ──────────────────────────────────────────────────────────────── */
function TopBar({ title, sidebarWidth }) {
  const { user } = useAuth();
  const initials  = getInitials(user?.name ?? user?.email);
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? '';

  return (
    <header style={{
      position:       'fixed',
      top:            0,
      left:           sidebarWidth,
      right:          0,
      height:         T.topBarHeight,
      background:     '#ffffff',
      borderBottom:   `1px solid ${T.border}`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 20px 0 24px',
      zIndex:         30,
      transition:     'left 0.2s ease',
    }}>
      {/* Left: breadcrumb navigation */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Breadcrumb title={title} />
      </div>

      {/* Right: Tenant badge + clock + notification bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Live SLA clock */}
        <LiveClock />

        {/* Tenant context indicator — interactive badge, rounded */}
        {user?.companyId && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            Tenant #{user.companyId}
          </span>
        )}

        {/* Role badge — interactive widget, rounded */}
        <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none">
          {roleLabel}
        </span>

        {/* Notification bell — interactive button */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textSecondary, display: 'flex', alignItems: 'center',
          padding: 6, borderRadius: 0,
        }}>
          <Bell size={17} />
        </button>

        {/* Avatar — circular interactive widget, rounded-full */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
          cursor: 'pointer',
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
/**
 * Props:
 *   title    — string shown in the top bar and breadcrumb last segment
 *   children — page content
 */
export default function AppShell({ title = 'Helpdesk Center', children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 64 : T.sidebarWidth;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    // Viewport lock — h-screen overflow-hidden (design-system §1C)
    <div style={{ height: '100vh', overflow: 'hidden', background: T.surface, display: 'flex' }}>
      <OfflineBanner />
      <Sidebar
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <div style={{
        flex:          1,
        marginLeft:    sidebarWidth,
        display:       'flex',
        flexDirection: 'column',
        transition:    'margin-left 0.2s ease',
        minWidth:      0,
      }}>
        <TopBar title={title} sidebarWidth={sidebarWidth} />
        {/* Main scroll cage — each inner page governs its own scroll */}
        <main style={{
          flex:       1,
          overflowY:  'auto',
          paddingTop: T.topBarHeight,
        }}>
          <div style={{ padding: '24px 24px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
