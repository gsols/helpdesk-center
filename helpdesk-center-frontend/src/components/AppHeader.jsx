import { LogOut } from 'lucide-react';

/* ── ClassifAi brand mark — inline SVG matching the stacked chevron logo ── */
function ClassifAiMark({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="8,6 40,6 36,14 4,14"  fill="#0b1c30" opacity="0.45" />
      <polygon points="4,16 36,16 32,24 0,24" fill="#0b1c30" opacity="0.70" />
      <polygon points="8,26 40,26 36,34 4,34" fill="#0b1c30" opacity="1.00" />
      <polygon points="0,24 8,6 8,14 4,14"   fill="#0b1c30" opacity="0.35" />
      <polygon points="4,34 12,16 8,16 0,34"  fill="#0b1c30" opacity="0.55" />
    </svg>
  );
}

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
          <ClassifAiMark size={20} />
        </div>
        <span style={wordmarkStyle}>
          Classif<span style={{ color: '#3b82d4' }}>Ai</span>
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
