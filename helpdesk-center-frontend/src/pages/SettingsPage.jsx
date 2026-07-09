/**
 * SettingsPage — wireframe style
 *
 * Twin-panel layout:
 *   Left nav sidebar (192px) — category items with left-accent active state
 *   Right panel — form fields using wireframe token colors
 */
import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { User, Building2, Plug, ChevronRight } from 'lucide-react';

const ALL_CATEGORIES = [
  { id: 'profile',      label: 'Profile',            icon: User      },
  { id: 'tenant',       label: 'Tenant Preferences', icon: Building2 },
  { id: 'integrations', label: 'Integrations',       icon: Plug      },
];

// ── Shared input styles ────────────────────────────────────────────────────────
const inputCls =
  'w-full h-9 px-3 text-[14px] border border-[#c6c6cd] bg-[#f8f9ff] ' +
  'text-[#0b1c30] placeholder:text-[#45464d] ' +
  'focus:outline-none focus:border-[#0b1c30] focus:ring-1 focus:ring-[#0b1c30] transition-colors';

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Profile panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ user }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saved,     setSaved]     = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name">
          <input type="text" defaultValue={user?.name} className={inputCls} readOnly style={{ borderRadius: 0 }} />
        </Field>
        <Field label="Email">
          <input type="email" defaultValue={user?.email} className={inputCls} readOnly style={{ borderRadius: 0 }} />
        </Field>
        <Field label="Role">
          <input
            type="text"
            value={user?.role?.replace(/_/g, ' ')}
            className={inputCls + ' capitalize cursor-not-allowed opacity-60'}
            readOnly
            style={{ borderRadius: 0 }}
          />
        </Field>
      </div>

      <div className="border-t border-[#c6c6cd] pt-5">
        <h3 className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest mb-4">Change Password</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Current Password">
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              className={inputCls} placeholder="••••••••" style={{ borderRadius: 0 }} />
          </Field>
          <Field label="New Password">
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              className={inputCls} placeholder="••••••••" style={{ borderRadius: 0 }} />
          </Field>
          <Field label="Confirm Password">
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className={inputCls} placeholder="••••••••" style={{ borderRadius: 0 }} />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="h-9 px-5 text-[14px] font-semibold text-white bg-slate-900 hover:bg-black transition-colors"
          style={{ borderRadius: 0 }}>
          Save Changes
        </button>
        {saved && <span className="text-[12px] font-semibold text-emerald-600">✓ Saved</span>}
      </div>
    </form>
  );
}

// ── Tenant Preferences panel ───────────────────────────────────────────────────
function TenantPanel() {
  const [company, setCompany]  = useState('');
  const [saved,   setSaved]    = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <Field label="Company Display Name">
        <input type="text" value={company} onChange={e => setCompany(e.target.value)}
          className={inputCls} placeholder="e.g. Acme Corporation" style={{ borderRadius: 0 }} />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="h-9 px-5 text-[14px] font-semibold text-white bg-slate-900 hover:bg-black transition-colors"
          style={{ borderRadius: 0 }}>
          Save Preferences
        </button>
        {saved && <span className="text-[12px] font-semibold text-emerald-600">✓ Saved</span>}
      </div>
    </form>
  );
}

// ── Integrations panel ────────────────────────────────────────────────────────
function IntegrationsPanel() {
  const [slackUrl, setSlackUrl] = useState('');
  const [saved,    setSaved]    = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="border border-[#c6c6cd] p-5" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 bg-[#611f69] flex items-center justify-center" style={{ borderRadius: 2 }}>
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <h3 className="text-[14px] font-semibold text-[#0b1c30]">Slack Notifications</h3>
        </div>
        <p className="text-[13px] text-[#45464d] mb-4 leading-relaxed">
          Post ticket lifecycle events (created, status changed, resolved) to a Slack channel
          using an Incoming Webhook URL.
        </p>
        <Field label="Incoming Webhook URL">
      
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="h-9 px-5 text-[14px] font-semibold text-white bg-slate-900 hover:bg-black transition-colors"
          style={{ borderRadius: 0 }}>
          Save Integration
        </button>
        {saved && <span className="text-[12px] font-semibold text-emerald-600">✓ Saved</span>}
      </div>
    </form>
  );
}

// ── SettingsPage ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user }   = useAuth();
  const [activeId, setActiveId] = useState('profile');

  const CATEGORIES = user?.role === 'employee'
    ? ALL_CATEGORIES.filter(c => c.id === 'profile')
    : ALL_CATEGORIES;

  const active = CATEGORIES.find(c => c.id === activeId);

  return (
    <AppShell title="Settings">
      <div className="flex border border-[#c6c6cd] bg-white overflow-hidden min-h-[480px]" style={{ borderRadius: 0 }}>

        {/* Left category sidebar */}
        <nav className="w-48 shrink-0 border-r border-[#c6c6cd] bg-[#f8f9ff]">
          <div className="px-4 py-3 border-b border-[#c6c6cd]">
            <span className="text-[11px] font-bold tracking-widest text-[#45464d] uppercase">Settings</span>
          </div>
          <div className="p-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className={[
                    'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors border-l-2',
                    isActive
                      ? 'bg-[#e5eeff] text-[#0b1c30] border-l-[#0b1c30]'
                      : 'text-[#45464d] hover:bg-[#eff4ff] border-l-transparent',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className="shrink-0" />
                    {cat.label}
                  </div>
                  {isActive && <ChevronRight size={12} className="shrink-0 opacity-60" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right content panel */}
        <div className="flex-1 min-w-0 p-7 overflow-y-auto">
          <h2 className="text-[18px] font-bold text-[#0b1c30] mb-1">{active?.label}</h2>
          <p className="text-[13px] text-[#45464d] mb-6">
            {activeId === 'profile'      && 'Manage your personal account credentials and identity.'}
            {activeId === 'tenant'       && 'Configure company-wide display preferences.'}
            {activeId === 'integrations' && 'Connect external services to receive notifications.'}
          </p>

          {activeId === 'profile'      && <ProfilePanel user={user} />}
          {activeId === 'tenant'       && <TenantPanel />}
          {activeId === 'integrations' && <IntegrationsPanel />}
        </div>
      </div>
    </AppShell>
  );
}
