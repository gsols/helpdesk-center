import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Headphones, AlertCircle } from 'lucide-react';
import { T } from '../styles/tokens';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'employee') navigate('/dashboard');
      else if (user.role === 'administrator') navigate('/admin');
      else navigate('/agent');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', height: 38, padding: '0 12px',
    border: `1px solid ${focused === field ? T.accent : T.border}`,
    borderRadius: T.radiusMd, fontSize: 13, boxSizing: 'border-box',
    outline: 'none', background: '#fff', color: T.textPrimary,
    boxShadow: focused === field ? `0 0 0 3px ${T.accentLight}` : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, padding: '24px 16px' }}>
      <div style={{
        background: '#fff', border: `1px solid ${T.border}`, borderRadius: T.radiusXl,
        padding: '40px 36px', width: '100%', maxWidth: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: T.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <Headphones size={26} color="#ffffff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary, marginBottom: 4, letterSpacing: '-0.02em' }}>Helpdesk Center</h1>
          <p style={{ fontSize: 13, color: T.textSecondary, textAlign: 'center' }}>Sign in to submit and track support requests</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input value={username} onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter your username" required autoFocus
              style={inputStyle('username')} onFocus={() => setFocused('username')} onBlur={() => setFocused(null)} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your password" required
              style={inputStyle('password')} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.danger }}>
              <AlertCircle size={13} />{error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            marginTop: 4, width: '100%', height: 40,
            background: loading ? T.navyMid : T.navy,
            color: '#fff', border: 'none', borderRadius: T.radiusMd,
            fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 };
