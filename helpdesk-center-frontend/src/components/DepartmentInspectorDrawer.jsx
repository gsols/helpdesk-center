/**
 * DepartmentInspectorDrawer.jsx
 *
 * Right-side slide-in panel showing:
 *   - Department name
 *   - Current manager with inline pencil → live-search handover
 *   - Active agents table
 *   - "Add New Agent" overlay with transfer interlock
 */
import { useState, useMemo, useEffect } from 'react';
import { X, Pencil, UserPlus, Users } from 'lucide-react';
import {
  useDepartmentDetail,
  useEligibleAgents,
  useAddAgent,
  useChangeManager,
} from '../hooks/useDepartments';
import { T, btnPrimary, btnSecondary, inputStyle } from '../styles/tokens';

// ─── Tiny shared sub-components ──────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>
      {children}
    </p>
  );
}

function UserSearchPicker({ label, placeholder, users = [], excluded = [], selected, onSelect, multi = false }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() =>
    users.filter(u =>
      !excluded.includes(u.id) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
       u.email.toLowerCase().includes(query.toLowerCase()))
    ), [users, excluded, query]);

  return (
    <div>
      {label && <SectionLabel>{label}</SectionLabel>}
      <input
        style={{ ...inputStyle, marginBottom: 4 }}
        placeholder={placeholder || 'Search users…'}
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {query.length > 0 && filtered.length > 0 && (
        <div style={{
          border: `1px solid ${T.border}`, borderRadius: 0, maxHeight: 180,
          overflowY: 'auto', background: '#fff', zIndex: 10, position: 'relative',
        }}>
          {filtered.map(u => {
            const isSelected = multi
              ? (selected || []).some(s => s.id === u.id)
              : selected?.id === u.id;
            return (
              <div
                key={u.id}
                onClick={() => { onSelect(u); setQuery(''); }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                  background: isSelected ? T.accentLight : '#fff',
                  borderBottom: `1px solid ${T.borderLight}`,
                  display: 'flex', flexDirection: 'column', gap: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? T.accentLight : '#fff'}
              >
                <span style={{ fontWeight: 600, color: T.textPrimary }}>{u.name}</span>
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  {u.email}
                  {u.departmentName ? ` · ${u.departmentName}` : ''}
                  {u.isActiveAgent ? ' · Agent' : ` · ${u.role}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Manager Handover Section ─────────────────────────────────────────────────

function ManagerField({ deptId, manager, allEligible }) {
  const [editing, setEditing]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const changeManager = useChangeManager(deptId);

  const usersExcludingManager = useMemo(
    () => (allEligible || []).filter(u => u.id !== manager?.id),
    [allEligible, manager]
  );

  const handleSelect = (u) => { setSelected(u); setShowConfirm(true); };

  const handleConfirm = () => {
    changeManager.mutate({ newManagerId: selected.id }, {
      onSuccess: () => { setEditing(false); setSelected(null); setShowConfirm(false); },
    });
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel>Department Manager</SectionLabel>

      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
            {manager?.name || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>None assigned</span>}
          </span>
          <button
            onClick={() => setEditing(true)}
            title="Change manager"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: T.textMuted, display: 'flex', alignItems: 'center' }}
          >
            <Pencil size={13} />
          </button>
        </div>
      ) : (
        <div>
          <UserSearchPicker
            placeholder="Search users…"
            users={usersExcludingManager}
            selected={selected}
            onSelect={handleSelect}
          />
          <button
            onClick={() => { setEditing(false); setSelected(null); }}
            style={{ ...btnSecondary, marginTop: 6, height: 28, fontSize: 12 }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Manager Handover Confirmation Modal */}
      {showConfirm && selected && (
        <ConfirmModal
          title="Change Department Manager?"
          body={`Are you sure you want to change the manager of this department? The previous manager will be downgraded to a standard employee, and ${selected.name} will gain full administrative operational clearance over this department's teams and analytics metrics.`}
          confirmLabel={changeManager.isPending ? 'Saving…' : 'Confirm Change'}
          onConfirm={handleConfirm}
          onCancel={() => { setShowConfirm(false); setSelected(null); setEditing(false); }}
          danger={false}
        />
      )}
    </div>
  );
}

// ─── Add Agent Overlay ────────────────────────────────────────────────────────

function AddAgentOverlay({ deptId, onClose }) {
  const { data: eligible = [] } = useEligibleAgents(deptId);
  const [selected, setSelected] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const addAgent = useAddAgent(deptId);

  const handleSelect = (u) => {
    setSelected(u);
    if (u.isActiveAgent) { setShowTransfer(true); }
    else { doAdd(u, false); }
  };

  const doAdd = (u, confirmTransfer) => {
    addAgent.mutate({ userId: u.id, confirmTransfer }, {
      onSuccess: () => { onClose(); },
    });
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
      zIndex: 30, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    }}>
      <div style={{
        width: 360, height: '100%', background: '#fff',
        borderLeft: `1px solid ${T.border}`, padding: 24, overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.textPrimary }}>Add Agent</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
            <X size={16} />
          </button>
        </div>
        <UserSearchPicker
          label="Select a user to add"
          placeholder="Search by name or email…"
          users={eligible}
          selected={selected}
          onSelect={handleSelect}
        />
        {eligible.length === 0 && (
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 12 }}>No eligible users found.</p>
        )}
      </div>

      {/* Transfer Interlock Modal */}
      {showTransfer && selected && (
        <ConfirmModal
          title="Transfer Agent?"
          body={`Transfer this agent to this department? This will instantly remove them from their original department queues and wipe their active ticket assignments.`}
          confirmLabel={addAgent.isPending ? 'Transferring…' : 'Confirm Transfer'}
          onConfirm={() => doAdd(selected, true)}
          onCancel={() => { setShowTransfer(false); setSelected(null); }}
          danger
        />
      )}
    </div>
  );
}

// ─── Shared Confirmation Modal ────────────────────────────────────────────────

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, danger = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 0, border: `1px solid ${T.border}`,
        padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 10 }}>{title}</p>
        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              ...btnPrimary,
              background: danger ? T.danger : '#0f172a',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export default function DepartmentInspectorDrawer({ deptId, allUsers, onClose }) {
  const { data: detail, isLoading } = useDepartmentDetail(deptId);
  const [showAddAgent, setShowAddAgent] = useState(false);

  if (isLoading || !detail) {
    return (
      <DrawerShell onClose={onClose} name="Loading…">
        <p style={{ fontSize: 13, color: T.textMuted }}>Loading department details…</p>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell onClose={onClose} name={detail.name}>
      {/* Manager field */}
      <ManagerField
        deptId={deptId}
        manager={detail.manager}
        allEligible={allUsers}
      />

      {/* Agents table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionLabel>Active Agents ({detail.agents.length})</SectionLabel>
          <button
            onClick={() => setShowAddAgent(true)}
            style={{ ...btnPrimary, height: 28, fontSize: 11, padding: '0 10px', gap: 4 }}
          >
            <UserPlus size={12} /> Add Agent
          </button>
        </div>

        {detail.agents.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Users size={28} style={{ color: T.textMuted, margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: T.textMuted }}>No agents in this department yet.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: '#f8f9ff' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>Name</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted }}>Active Tickets</th>
              </tr>
            </thead>
            <tbody>
              {detail.agents.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding: '8px 8px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0 }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{a.email}</p>
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: a.activeTicketCount > 0 ? T.accent : T.textMuted }}>
                    {a.activeTicketCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Agent overlay panel */}
      {showAddAgent && (
        <AddAgentOverlay deptId={deptId} onClose={() => setShowAddAgent(false)} />
      )}
    </DrawerShell>
  );
}

// ─── Drawer shell wrapper ─────────────────────────────────────────────────────

function DrawerShell({ name, onClose, children }) {
  const [visible, setVisible] = useState(false);

  // Trigger the enter animation on the next paint after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{
      position: 'relative', width: 380, flexShrink: 0,
      borderLeft: `1px solid ${T.border}`, background: '#fff',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      transform: visible ? 'translateX(0)' : 'translateX(24px)',
      opacity: visible ? 1 : 0,
      transition: 'transform 240ms ease, opacity 220ms ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: T.textPrimary }}>{name}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}>
          <X size={16} />
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: 20, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
