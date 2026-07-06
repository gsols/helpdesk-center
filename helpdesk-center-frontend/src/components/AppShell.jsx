import { useState } from 'react';
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
    { label: 'Dashboard',   icon: LayoutDashboard, to: '/dashboard' },
    { label: 'My Tickets',  icon: Ticket,          to: '/dashboard' },
  ],
  agent: [
    { label: 'Queue',       icon: LayoutDashboard, to: '/agent'     },
  ],
  dept_manager: [
    { label: 'Queue',       icon: LayoutDashboard, to: '/agent'     },
    { label: 'Admin',       icon: Settings,        to: '/admin'     },
  ],
  sys_admin: [
    { label: 'Dashboard',   icon: LayoutDashboard, to: '/admin'     },
    { label: 'All Tickets', icon: Ticket,          to: '/admin'     },
    { label: 'Settings',    icon: Settings,        to: '/admin'     },
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
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        width:        '100%',
        padding:      collapsed ? '10px 0' : '10px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background:   active ? T.navyDark : hovered ? T.navyMid : 'transparent',
        border:       'none',
        borderRadius: 6,
        cursor:       'pointer',
        color:        active ? '#ffffff' : T.sidebarText,
        fontSize:     13,
        fontWeight:   active ? 600 : 400,
        borderLeft:   active ? `3px solid ${T.accent}` : '3px solid transparent',
        transition:   'background 0.12s, color 0.12s',
        textAlign:    'left',
      }}
    >
      <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ user, onLogout, collapsed, onToggle }) {
  const location = useNavigate();
  const { pathname } = useLocation();
  const navItems = NAV[user?.role] ?? [];
  const initials  = getInitials(user?.name ?? user?.email);
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? '';

  return (
    <aside style={{
      position:   'fixed',
      top:        0,
      left:       0,
      height:     '100vh',
      width:      collapsed ? 64 : T.sidebarWidth,
      background: T.navy,
      display:    'flex',
      flexDirection: 'column',
      zIndex:     40,
      transition: 'width 0.2s ease',
      overflowX:  'hidden',
    }}>
      {/* Logo row */}
      <div style={{
        height:     T.topBarHeight,
        display:    'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding:    collapsed ? 0 : '0 14px',
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
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
            width: 32, height: 32, borderRadius: 8,
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
            padding: 4, borderRadius: 4, flexShrink: 0,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavItem
            key={item.label}
            item={item}
            active={pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to) && item.to !== '/admin' && item.to !== '/dashboard' && item.to !== '/agent')}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* User section */}
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sidebarMuted, display: 'flex', padding: 4, borderRadius: 4, flexShrink: 0 }}
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sidebarMuted, display: 'flex', padding: 4, borderRadius: 4 }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── TopBar ──────────────────────────────────────────────────────────────── */
function TopBar({ title, sidebarWidth }) {
  const { user } = useAuth();
  const initials  = getInitials(user?.name ?? user?.email);

  return (
    <header style={{
      position:    'fixed',
      top:         0,
      left:        sidebarWidth,
      right:       0,
      height:      T.topBarHeight,
      background:  '#ffffff',
      borderBottom:`1px solid ${T.border}`,
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'space-between',
      padding:     '0 24px',
      zIndex:      30,
      transition:  'left 0.2s ease',
    }}>
      <h1 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, letterSpacing: '-0.01em' }}>
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textSecondary, display: 'flex', alignItems: 'center',
          padding: 6, borderRadius: 6,
        }}>
          <Bell size={17} />
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
      </div>
    </header>
  );
}

/* ── AppShell ────────────────────────────────────────────────────────────── */
/**
 * Props:
 *   title    — string shown in the top bar
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
    <div style={{ minHeight: '100vh', background: T.surface }}>
      <Sidebar
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <TopBar title={title} sidebarWidth={sidebarWidth} />
      <main style={{
        marginLeft:  sidebarWidth,
        paddingTop:  T.topBarHeight,
        minHeight:   '100vh',
        transition:  'margin-left 0.2s ease',
      }}>
        <div style={{ padding: '24px 24px' }}>
          {children}
        </div>
      </main>

      {/* Responsive: hide sidebar on mobile, show hamburger */}
      <style>{`
        @media (max-width: 768px) {
          /* AppShell sidebar goes icon-only */
        }
      `}</style>
    </div>
  );
}
