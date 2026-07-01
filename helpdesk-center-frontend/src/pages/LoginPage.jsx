import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Headphones, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'employee') {
        navigate('/dashboard');
      } else {
        navigate('/agent');
      }
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width:       '100%',
    height:      36,
    padding:     '0 12px',
    border:      `1px solid ${focusedField === field ? '#3b82d4' : '#d1d5db'}`,
    borderRadius: 6,
    fontSize:    13,
    boxSizing:   'border-box',
    outline:     'none',
    boxShadow:   focusedField === field ? '0 0 0 3px rgba(59,130,212,0.15)' : 'none',
    transition:  'border-color 0.15s, box-shadow 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa', padding: '24px 16px' }}>
      <div style={{
        background:   '#ffffff',
        border:       '1px solid #e5e7eb',
        borderRadius: 12,
        padding:      '36px 32px',
        width:        '100%',
        maxWidth:     360,
        boxShadow:    '0 1px 3px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Headphones size={24} color="#3b82d4" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2328', marginBottom: 4 }}>Helpdesk Center</h1>
          <p style={{ fontSize: 13, color: '#57606a', textAlign: 'center' }}>Submit and track your support requests</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter your username"
              required
              autoFocus
              style={inputStyle('username')}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your password"
              required
              style={inputStyle('password')}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626' }}>
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop:    4,
              width:        '100%',
              height:       36,
              background:   loading ? '#7fb3e8' : '#3b82d4',
              color:        '#fff',
              border:       'none',
              borderRadius: 6,
              fontWeight:   600,
              fontSize:     13,
              cursor:       loading ? 'not-allowed' : 'pointer',
              transition:   'background 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display:     'block',
  fontSize:    13,
  fontWeight:  600,
  color:       '#1f2328',
  marginBottom: 6,
};
