import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Headphones, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Role is lowercased in AuthContext from the enum name (e.g. 'employee', 'agent', 'sys_admin')
      const role = user.role?.toLowerCase?.() ?? '';
      if (role === 'employee')    navigate('/dashboard');
      else if (role === 'sys_admin') navigate('/admin');
      else navigate('/agent'); // agent, dept_manager
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) =>
    `w-full h-9.5 px-3 text-sm border rounded-md outline-none bg-white transition-all
     ${focused === field
       ? 'border-blue-500 ring-2 ring-blue-100'
       : 'border-gray-300'
     }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-10 w-full max-w-sm shadow-lg">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-13 h-13 rounded-2xl bg-blue-900 flex items-center justify-center mb-3.5">
            <Headphones size={26} color="#ffffff" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight mb-1">Helpdesk Center</h1>
          <p className="text-sm text-gray-500 text-center">Sign in to submit and track support requests</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="you@company.com"
              required
              autoFocus
              className={inputCls('email')}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your password"
              required
              className={inputCls('password')}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} />{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full h-10 bg-blue-900 text-white rounded-md font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Test credentials hint */}
        <p className="mt-5 text-xs text-gray-400 text-center">
          Demo: <code className="text-gray-500">john.doe@company.com</code> / <code className="text-gray-500">password123</code>
        </p>
      </div>
    </div>
  );
}
