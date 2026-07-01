import { Headphones, LogOut } from 'lucide-react';

function getInitials(fullName) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

const ROLE_LABELS = {
  employee:    'Employee',
  it_hardware: 'IT Hardware',
  it_software: 'IT Software',
  hr:          'HR',
};

export default function AppHeader({ user, onLogout }) {
  const initials  = getInitials(user?.fullName);
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role ?? '';

  return (
    <header style={headerStyle}>
      {/* Logo / wordmark */}
      <div style={logoWrapStyle}>
        <div style={logoIconStyle}>
          <Headphones size={16} color="#3b82d4" strokeWidth={2.5} />
        </div>
        <span style={wordmarkStyle}>
          Helpdesk <span style={{ color: '#3b82d4' }}>Center</span>
        </span>
      </div>

      {/* Right side */}
      <div style={rightStyle}>
        {/* Avatar pill — full on desktop, icon-only on mobile */}
        <div style={pillStyle} className="hide-mobile">
          <div style={avatarStyle}>{initials}</div>
          <span style={nameStyle}>{user?.fullName}</span>
          <span style={roleBadgeStyle}>{roleLabel}</span>
        </div>

        {/* Mobile: just the avatar circle */}
        <div style={{ ...avatarStyle, display: 'none' }} className="show-mobile">
          {initials}
        </div>

        {/* Logout */}
        <button onClick={onLogout} style={logoutBtnStyle} title="Logout">
          <LogOut size={14} />
          <span className="hide-mobile" style={{ marginLeft: 4 }}>Logout</span>
        </button>
      </div>
    </header>
  );
}

const headerStyle = {
  position:       'sticky',
  top:            0,
  zIndex:         30,
  height:         56,
  background:     '#ffffff',
  borderBottom:   '1px solid #e5e7eb',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  padding:        '0 24px',
};

const logoWrapStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:        8,
};

const logoIconStyle = {
  width:          32,
  height:         32,
  borderRadius:   8,
  background:     '#eff6ff',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  flexShrink:     0,
};

const wordmarkStyle = {
  fontSize:   15,
  fontWeight: 700,
  color:      '#1f2328',
  letterSpacing: '-0.01em',
};

const rightStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:        12,
};

const pillStyle = {
  display:      'flex',
  alignItems:   'center',
  gap:          8,
  padding:      '6px 12px',
  border:       '1px solid #e5e7eb',
  borderRadius: 999,
  background:   '#ffffff',
};

const avatarStyle = {
  width:          24,
  height:         24,
  borderRadius:   '50%',
  background:     '#3b82d4',
  color:          '#fff',
  fontSize:       10,
  fontWeight:     700,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  flexShrink:     0,
};

const nameStyle = {
  fontSize:   13,
  fontWeight: 500,
  color:      '#1f2328',
};

const roleBadgeStyle = {
  fontSize:     10,
  fontWeight:   600,
  color:        '#3b82d4',
  background:   '#eff6ff',
  border:       '1px solid #bfdbfe',
  padding:      '2px 6px',
  borderRadius: 4,
  textTransform: 'capitalize',
};

const logoutBtnStyle = {
  display:      'flex',
  alignItems:   'center',
  fontSize:     13,
  color:        '#57606a',
  background:   'none',
  border:       'none',
  borderRadius: 6,
  padding:      '6px 10px',
  cursor:       'pointer',
  transition:   'background 0.15s, color 0.15s',
};
