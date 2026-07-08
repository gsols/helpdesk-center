/**
 * SettingsPage (ui-ux-blueprint.md §6)
 *
 * Twin-panel split layout:
 *   Left sidebar — settings category nav
 *   Right panel  — editable fields for the selected category
 *
 * Categories:
 *   profile      — Password change, name, role display
 *   tenant       — Company preferences, dark/light mode toggle
 *   integrations — Slack webhook input
 */
import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { User, Building2, Plug, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'profile',      label: 'Profile',         icon: User      },
  { id: 'tenant',       label: 'Tenant Preferences', icon: Building2 },
  { id: 'integrations', label: 'Integrations',    icon: Plug      },
];

/* ── Input helper ────────────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full h-9 px-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-none bg-white dark:bg-neutral-900 ' +
  'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 ' +
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';

/* ── Profile panel ───────────────────────────────────────────────────────── */
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
          <input type="text" defaultValue={user?.name} className={inputCls} readOnly />
        </Field>
        <Field label="Email">
          <input type="email" defaultValue={user?.email} className={inputCls} readOnly />
        </Field>
        <Field label="Role">
          <input
            type="text"
            value={user?.role?.replace(/_/g, ' ')}
            className={inputCls + ' capitalize cursor-not-allowed opacity-60'}
            readOnly
          />
        </Field>
      </div>

      {/* Password change */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-5">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Change Password
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Current Password">
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              className={inputCls} placeholder="••••••••" />
          </Field>
          <Field label="New Password">
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              className={inputCls} placeholder="••••••••" />
          </Field>
          <Field label="Confirm Password">
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className={inputCls} placeholder="••••••••" />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="h-9 px-5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors">
          Save Changes
        </button>
        {saved && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Saved</span>
        )}
      </div>
    </form>
  );
}

/* ── Tenant Preferences panel ────────────────────────────────────────────── */
function TenantPanel() {
  const [darkMode, setDarkMode] = useState(false);
  const [company,  setCompany]  = useState('');
  const [saved,    setSaved]    = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <Field label="Company Display Name">
        <input type="text" value={company} onChange={e => setCompany(e.target.value)}
          className={inputCls} placeholder="e.g. Acme Corporation" />
      </Field>

      <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dark Mode</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between light and dark interface theme</p>
        </div>
        {/* Toggle — interactive widget, rounded */}
        <button
          type="button"
          onClick={() => setDarkMode(v => !v)}
          className={[
            'relative inline-flex w-10 h-5.5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none',
            darkMode ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600',
          ].join(' ')}
          aria-pressed={darkMode}
        >
          <span className={[
            'inline-block w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ease-in-out mt-[3px]',
            darkMode ? 'translate-x-5' : 'translate-x-1',
          ].join(' ')} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="h-9 px-5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors">
          Save Preferences
        </button>
        {saved && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Saved</span>
        )}
      </div>
    </form>
  );
}

/* ── Integrations panel ──────────────────────────────────────────────────── */
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
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-none p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 bg-[#611f69] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Slack Notifications</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Post ticket lifecycle events (created, status changed, resolved) to a Slack channel
          using an Incoming Webhook URL.
        </p>
        <Field label="Incoming Webhook URL">
          <input
            type="url"
            value={slackUrl}
            onChange={e => setSlackUrl(e.target.value)}
            className={inputCls}
            placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="h-9 px-5 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800 transition-colors">
          Save Integration
        </button>
        {saved && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Saved</span>
        )}
      </div>
    </form>
  );
}

/* ── SettingsPage ─────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user }  = useAuth();
  const [activeId, setActiveId] = useState('profile');
  const active = CATEGORIES.find(c => c.id === activeId);

  return (
    <AppShell title="Settings">
      {/* Twin-panel layout */}
      <div className="flex gap-0 border border-neutral-200 dark:border-neutral-700 rounded-none overflow-hidden bg-white dark:bg-neutral-900 min-h-[480px]">

        {/* Left category sidebar — structural, rounded-none */}
        <nav className="w-52 shrink-0 border-r border-neutral-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
              Settings
            </span>
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
                    'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm font-medium',
                    'transition-colors rounded-none',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-l-2 border-l-blue-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 border-l-2 border-l-transparent',
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {active?.label}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {activeId === 'profile'      && 'Manage your personal account credentials and identity.'}
            {activeId === 'tenant'       && 'Configure company-wide display preferences and theme settings.'}
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
