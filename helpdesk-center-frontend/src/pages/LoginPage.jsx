/**
 * LoginPage — "Gateway Access" wireframe
 *
 * Layout:
 *  • #f8f9ff background, dot-grid pattern
 *  • OMNISUPPORT shield logo + wordmark centered above card
 *  • White card with 3px left-edge blue accent bar, sharp corners
 *  • Fields: Workspace ID (.omnisupport.io suffix), Corporate Email, Password (eye toggle)
 *  • FORGOT SECURITY KEY? link on password row
 *  • AUTHENTICATE & ENTER → dark button full-width
 *  • Demo accounts panel below card — one-tap sign in
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

/* ── Sample accounts matching the data seeder ───────────────────────────── */
const SAMPLE_ACCOUNTS = [
  // Employee
  { label: 'Alex Rivera',   role: 'EMPLOYEE',     email: 'employee@ibm.com',              color: '#3b82f6' },
  // HR Agents
  { label: 'Jordan Lee',    role: 'AGENT',        email: 'hr.agent.alpha@ibm.com',        color: '#8b5cf6' },
  { label: 'Dana Kim',      role: 'AGENT',        email: 'hr.agent.beta@ibm.com',         color: '#8b5cf6' },
  { label: 'Marcus Reid',   role: 'AGENT',        email: 'hr.agent.gamma@ibm.com',        color: '#8b5cf6' },
  // IT Software Agents
  { label: 'Morgan Chen',   role: 'AGENT',        email: 'software.agent.alpha@ibm.com',  color: '#8b5cf6' },
  { label: 'Riley Nguyen',  role: 'AGENT',        email: 'software.agent.beta@ibm.com',   color: '#8b5cf6' },
  { label: 'Priya Patel',   role: 'AGENT',        email: 'software.agent.gamma@ibm.com',  color: '#8b5cf6' },
  // IT Hardware Agents
  { label: 'Casey Park',    role: 'AGENT',        email: 'hardware.agent.alpha@ibm.com',  color: '#8b5cf6' },
  { label: 'Avery Brooks',  role: 'AGENT',        email: 'hardware.agent.beta@ibm.com',   color: '#8b5cf6' },
  { label: 'Devon Reyes',   role: 'AGENT',        email: 'hardware.agent.gamma@ibm.com',  color: '#8b5cf6' },
  // Department Managers
  { label: 'Sam Torres',    role: 'DEPT_MANAGER', email: 'hr.manager@ibm.com',            color: '#f59e0b' },
  { label: 'Taylor Owens',  role: 'DEPT_MANAGER', email: 'software.manager@ibm.com',      color: '#f59e0b' },
  { label: 'Jamie Flores',  role: 'DEPT_MANAGER', email: 'hardware.manager@ibm.com',      color: '#f59e0b' },
  // Admin
  { label: 'System Admin',  role: 'SYS_ADMIN',    email: 'admin@ibm.com',                 color: '#ef4444' },
];

const ROLE_BADGE = {
  EMPLOYEE:     { bg: '#eff6ff', text: '#1d4ed8' },
  AGENT:        { bg: '#f5f3ff', text: '#6d28d9' },
  DEPT_MANAGER: { bg: '#fffbeb', text: '#b45309' },
  SYS_ADMIN:    { bg: '#fef2f2', text: '#b91c1c' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [workspace, setWorkspace] = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acct) => {
    setError('');
    setLoading(true);
    setEmail(acct.email);
    setPassword('password123');
    try {
      await login(acct.email, 'password123');
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight:   '100vh',
        background:  '#f8f9ff',
        display:     'flex',
        flexDirection: 'column',
        alignItems:  'center',
        justifyContent: 'center',
        padding:     '24px',
        backgroundImage: 'radial-gradient(circle, #c6c6cd 1px, transparent 1px)',
        backgroundSize:  '24px 24px',
      }}
    >
      {/* ── OMNISUPPORT logo + wordmark ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 6,
            background: '#0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={22} color="#ffffff" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          OMNISUPPORT
        </span>
      </div>

      {/* ── Login card ───────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%', maxWidth: 440,
          background: '#ffffff',
          borderRadius: 0,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#0f172a' }} />

        <div style={{ padding: '32px 36px 36px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Gateway Access
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
            Authorize your secure support session.
          </p>

          {error && (
            <div style={{ marginBottom: 20, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Workspace ID */}
            <div>
              <label style={labelStyle}>Workspace ID</label>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                <input
                  type="text"
                  placeholder="company-subdomain"
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  style={{
                    flex: 1, height: 40, padding: '0 12px',
                    border: 'none', outline: 'none',
                    fontSize: 14, color: '#0f172a',
                    fontFamily: "'JetBrains Mono', monospace",
                    background: 'transparent',
                  }}
                />
                <span style={{
                  display: 'flex', alignItems: 'center', padding: '0 12px',
                  background: '#f8fafc', borderLeft: '1px solid #e2e8f0',
                  fontSize: 13, color: '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: 'nowrap',
                }}>
                  .omnisupport.io
                </span>
              </div>
            </div>

            {/* Corporate Email */}
            <div>
              <label style={labelStyle}>Corporate Email</label>
              <input
                type="email"
                placeholder="agent@ibm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', textDecoration: 'none', letterSpacing: '0.02em' }}>
                  FORGOT SECURITY KEY?
                </a>
              </div>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ flex: 1, height: 40, padding: '0 12px', border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ padding: '0 12px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 46,
                background: loading ? '#374151' : '#0f172a',
                color: '#ffffff', border: 'none', borderRadius: 6,
                fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Authenticating…
                </>
              ) : (
                <>Authenticate &amp; Enter →</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Demo accounts panel ──────────────────────────────────────────── */}
      <div
        style={{
          width: '100%', maxWidth: 440, marginTop: 16,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#0f172a' }} />
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
            Demo Accounts — click to sign in
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SAMPLE_ACCOUNTS.map((acct) => {
              const badge = ROLE_BADGE[acct.role] ?? { bg: '#f1f5f9', text: '#475569' };
              return (
                <button
                  key={acct.email}
                  onClick={() => handleQuickLogin(acct)}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left', width: '100%',
                    transition: 'background 120ms, border-color 120ms',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: acct.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: '16px' }}>{acct.label}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", lineHeight: '14px' }}>{acct.email}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '2px 7px', background: badge.bg, color: badge.text, whiteSpace: 'nowrap',
                  }}>
                    {acct.role.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 10 }}>
            All demo accounts use password:{' '}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#64748b' }}>password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  color: '#64748b', marginBottom: 6,
};

const inputStyle = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid #cbd5e1', borderRadius: 6,
  fontSize: 14, outline: 'none',
  background: '#ffffff', color: '#0f172a',
  boxSizing: 'border-box', display: 'block',
};
