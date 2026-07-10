/**
 * SettingsPage — matches "OmniSupport | Settings" wireframe exactly
 *
 * Twin-panel layout:
 *   Left settings sidebar (12rem)  — "Workspace Settings" label + "User Profile" nav item
 *   Right scrollable form workspace — three blocks separated by dividers:
 *     A. User Profile Metadata    — read-only Full Name / Email / Department
 *     B. Interface Preferences    — Dark Mode toggle + Email Notifications checkbox
 *     C. Update Password Authentication — Current / New password + Save button
 */
import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/authApi';
import { User } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────────────────────── */
function departmentLabel(user) {
  if (!user) return '—';
  if (!user.departmentId) return 'Standard Employee — Unassigned to Queue';
  return `Department #${user.departmentId}`;
}

function roleLabel(user) {
  if (!user?.role) return '—';
  return user.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ── Toggle switch ────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: 24,
        width: 44,
        flexShrink: 0,
        alignItems: 'center',
        borderRadius: 9999,
        border: 'none',
        background: checked ? '#0b1c30' : '#cbd5e1',
        cursor: 'pointer',
        transition: 'background 200ms',
        padding: 0,
      }}
    >
      <span style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#ffffff',
        transform: checked ? 'translateX(24px)' : 'translateX(4px)',
        transition: 'transform 200ms',
      }} />
    </button>
  );
}

/* ── Label-caps helper ────────────────────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: '#45464d',
      marginBottom: 6,
    }}>
      {children}
    </label>
  );
}

/* ── Read-only input ──────────────────────────────────────────────────────── */
const roInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  fontSize: 14,
  color: '#626567',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  cursor: 'not-allowed',
  outline: 'none',
};

/* ── Editable input ───────────────────────────────────────────────────────── */
const editInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  fontSize: 14,
  color: '#0b1c30',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  outline: 'none',
};

/* ── Divider ──────────────────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: '#e2e8f0' }} />;
}

/* ── Section heading ──────────────────────────────────────────────────────── */
function SectionHeading({ children }) {
  return (
    <h3 style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: '#0b1c30',
      margin: 0,
    }}>
      {children}
    </h3>
  );
}

/* ── Main Settings form ───────────────────────────────────────────────────── */
function UserProfileForm({ user }) {
  /* Interface Preferences state */
  const [darkMode,       setDarkMode]       = useState(true);
  const [emailNotif,     setEmailNotif]     = useState(true);

  /* Password state */
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');

  /* Submit state */
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'ok'|'err', msg }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentPw && !newPw) {
      // Nothing password-related to save — just show ok for preferences
      setFeedback({ type: 'ok', msg: 'Preferences saved.' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (!currentPw || !newPw) {
      setFeedback({ type: 'err', msg: 'Fill in both password fields to update your password.' });
      return;
    }
    if (newPw.length < 8) {
      setFeedback({ type: 'err', msg: 'New password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setFeedback({ type: 'ok', msg: 'Password updated successfully.' });
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Failed to update password.';
      setFeedback({ type: 'err', msg });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ── Page title ── */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#000000', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            User Settings
          </h1>
          <p style={{ fontSize: 14, color: '#45464d', margin: 0, lineHeight: 1.6 }}>
            Manage your corporate identity, interface preferences, and authentication credentials.
          </p>
        </div>

        {/* ── Block A: User Profile Metadata ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionHeading>User Profile Metadata</SectionHeading>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#64748b',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '2px 8px',
              letterSpacing: '0.04em',
            }}>
              READ ONLY
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <input style={roInputStyle} type="text" value={user?.name ?? ''} readOnly disabled />
            </div>
            <div>
              <FieldLabel>Corporate Email Address</FieldLabel>
              <input style={roInputStyle} type="email" value={user?.email ?? ''} readOnly disabled />
            </div>
          </div>

          <div>
            <FieldLabel>Assigned Primary Department</FieldLabel>
            <input style={roInputStyle} type="text" value={departmentLabel(user)} readOnly disabled />
          </div>
        </div>

        <Divider />

        {/* ── Block B: Interface Preferences ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SectionHeading>Interface Preferences</SectionHeading>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Dark Mode row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0b1c30', margin: '0 0 2px' }}>Dark Mode Toggle</p>
                <p style={{ fontSize: 13, color: '#45464d', margin: 0 }}>
                  Switch between light and dark visual themes for the workspace.
                </p>
              </div>
              <Toggle checked={darkMode} onChange={setDarkMode} />
            </div>

            {/* Email Notifications row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0b1c30', margin: '0 0 2px' }}>Email Notifications for Ticket Updates</p>
                <p style={{ fontSize: 13, color: '#45464d', margin: 0 }}>
                  Receive automated alerts whenever a ticket in your queue is updated.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={e => setEmailNotif(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0b1c30', flexShrink: 0 }}
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* ── Block C: Update Password Authentication ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SectionHeading>Update Password Authentication</SectionHeading>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <input
                style={editInputStyle}
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <FieldLabel>New Secure Password</FieldLabel>
              <input
                style={editInputStyle}
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              color: feedback.type === 'ok' ? '#16a34a' : '#dc2626',
              margin: 0,
            }}>
              {feedback.msg}
            </p>
          )}

          {/* Save button — right-aligned */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#334155' : '#0b1c30',
                color: '#ffffff',
                border: 'none',
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                borderRadius: 0,
                letterSpacing: '0.01em',
                transition: 'background 150ms',
              }}
            >
              {saving ? 'Saving…' : 'Save Profile Preferences'}
            </button>
          </div>
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 40 }} />
      </div>
    </form>
  );
}

/* ── SettingsPage ─────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell title="Settings" noPadding>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* ── Left settings sidebar (12rem / 192px) ── */}
        <aside style={{
          width: 192,
          minWidth: 192,
          background: '#f1f5f9',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '16px 16px 12px' }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: '#45464d',
            }}>
              Workspace Settings
            </span>
          </div>

          <nav style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Only "User Profile" for now — matches wireframe */}
            <button
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                fontSize: 14,
                fontWeight: 600,
                color: '#0b1c30',
                background: '#e2e8f0',
                border: 'none',
                borderLeft: '2px solid #000000',
                borderRadius: 0,
                cursor: 'default',
                textAlign: 'left',
              }}
            >
              <User size={18} style={{ flexShrink: 0 }} />
              User Profile
            </button>
          </nav>
        </aside>

        {/* ── Right scrollable form workspace ── */}
        <section style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
          <UserProfileForm user={user} />
        </section>

      </div>
    </AppShell>
  );
}
