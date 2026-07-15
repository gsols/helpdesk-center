/**
 * DepartmentManager.jsx
 *
 * Screen A — Master Department List View (SYS_ADMIN only)
 *
 * Layout:
 *   Left: scrollable department card list + header actions
 *   Right: DepartmentInspectorDrawer (slides open on card click)
 *
 * Features:
 *   - "Create New Department" → modal with name, required manager picker, optional multi-agent picker
 *   - "Delete Department" (per row) → cascade warning confirmation
 *   - Clicking a card opens the inspector drawer
 */
import { useState, useMemo } from 'react';
import { Building2, Plus, Trash2, ChevronRight } from 'lucide-react';
import {
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  useAllUsers,
} from '../hooks/useDepartments';
import DepartmentInspectorDrawer from './DepartmentInspectorDrawer';
import { T, btnPrimary, btnSecondary, inputStyle, cardStyle } from '../styles/tokens';

// ─── Tiny shared helpers ──────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>
      {children}
    </p>
  );
}

function UserChip({ user, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: T.accentLight, border: `1px solid #c7d7f7`,
      borderRadius: 4, padding: '2px 8px', fontSize: 12, color: T.textPrimary,
    }}>
      {user.name}
      <button
        onClick={() => onRemove(user.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0, lineHeight: 1, fontSize: 14 }}
      >
        ×
      </button>
    </span>
  );
}

function UserSearchPicker({ placeholder, users = [], excluded = [], onSelect }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() =>
    users.filter(u =>
      !excluded.includes(u.id) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
       u.email.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 30),
    [users, excluded, query]
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        style={inputStyle}
        placeholder={placeholder || 'Search users…'}
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {query.length > 0 && filtered.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '100%',
          border: `1px solid ${T.border}`, borderRadius: 0,
          background: '#fff', zIndex: 20, maxHeight: 200, overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          {filtered.map(u => (
            <div
              key={u.id}
              onClick={() => { onSelect(u); setQuery(''); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                borderBottom: `1px solid ${T.borderLight}`,
                display: 'flex', flexDirection: 'column', gap: 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontWeight: 600, color: T.textPrimary }}>{u.name}</span>
              <span style={{ fontSize: 11, color: T.textMuted }}>
                {u.email}
                {u.departmentName ? ` · ${u.departmentName}` : ''}
                {` · ${u.role}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Department Modal ──────────────────────────────────────────────────

function CreateDepartmentModal({ allUsers, onClose }) {
  const [name, setName]         = useState('');
  const [manager, setManager]   = useState(null);
  const [agents, setAgents]     = useState([]);
  const createDept              = useCreateDepartment();

  const excludedFromManager = useMemo(() => agents.map(a => a.id), [agents]);
  const excludedFromAgents  = useMemo(() => [manager?.id, ...agents.map(a => a.id)].filter(Boolean), [manager, agents]);

  const canSubmit = name.trim().length > 0 && manager !== null && !createDept.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createDept.mutate(
      { name: name.trim(), managerId: manager.id, agentIds: agents.map(a => a.id) },
      { onSuccess: onClose }
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 0, border: `1px solid ${T.border}`,
        padding: 28, width: 480, maxWidth: '95vw',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}>
        {/* Title */}
        <p style={{ fontWeight: 700, fontSize: 16, color: T.textPrimary, marginBottom: 20 }}>
          Create New Department
        </p>

        {/* 1. Department Name */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Department Name <span style={{ color: T.danger }}>*</span></SectionLabel>
          <input
            style={inputStyle}
            placeholder="e.g. Information Technology"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* 2. Manager Picker (required) */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Manager <span style={{ color: T.danger }}>*</span></SectionLabel>
          {manager ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserChip user={manager} onRemove={() => setManager(null)} />
            </div>
          ) : (
            <UserSearchPicker
              placeholder="Search for a manager…"
              users={allUsers}
              excluded={excludedFromManager}
              onSelect={setManager}
            />
          )}
        </div>

        {/* 3. Initial Agents (optional multi-select) */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Initial Agents <span style={{ color: T.textMuted }}>(optional)</span></SectionLabel>
          <UserSearchPicker
            placeholder="Search users to add as agents…"
            users={allUsers}
            excluded={excludedFromAgents}
            onSelect={u => setAgents(prev => [...prev, u])}
          />
          {agents.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {agents.map(a => (
                <UserChip
                  key={a.id}
                  user={a}
                  onRemove={id => setAgents(prev => prev.filter(x => x.id !== id))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...btnPrimary,
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {createDept.isPending ? 'Creating…' : 'Create Department'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ dept, onConfirm, onCancel, isPending }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 0, border: `1px solid ${T.border}`,
        padding: 24, maxWidth: 440, width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 10 }}>
          Delete "{dept.name}"?
        </p>
        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
          Deleting this department will permanently purge all associated tickets, messages, and attachments.
          All agents and managers will be downgraded to standard employees.
          <strong style={{ display: 'block', marginTop: 8, color: T.danger }}>This action cannot be undone.</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{ ...btnPrimary, background: T.danger }}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete Department'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DepartmentManager() {
  const { data: departments = [], isLoading } = useDepartments();
  const { data: allUsers = [] }               = useAllUsers();
  const deleteDept                            = useDeleteDepartment();

  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [deptToDelete, setDeptToDelete]     = useState(null);

  const handleDelete = (dept, e) => {
    e.stopPropagation();
    setDeptToDelete(dept);
  };

  const confirmDelete = () => {
    deleteDept.mutate(deptToDelete.id, {
      onSuccess: () => {
        setDeptToDelete(null);
        if (selectedDeptId === deptToDelete.id) setSelectedDeptId(null);
      },
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* ── Left: Department List ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        transition: 'padding-right 250ms ease',
        paddingRight: selectedDeptId ? 8 : 0,
      }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Departments</h2>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0' }}>
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, gap: 6, marginRight: 12 }}>
            <Plus size={14} />
            Create New Department
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <p style={{ fontSize: 13, color: T.textMuted }}>Loading departments…</p>
        )}

        {/* Empty state */}
        {!isLoading && departments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Building2 size={36} style={{ color: T.textMuted, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: T.textMuted }}>No departments yet.</p>
            <p style={{ fontSize: 13, color: T.textMuted }}>Click "Create New Department" to get started.</p>
          </div>
        )}

        {/* Department cards */}
        {departments.map(dept => {
          const isActive = dept.id === selectedDeptId;
          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(isActive ? null : dept.id)}
              style={{
                ...cardStyle,
                padding: '14px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isActive ? T.accentLight : '#fff',
                borderColor: isActive ? T.accent : T.border,
                borderLeft: isActive ? `3px solid ${T.accent}` : `3px solid transparent`,
                transition: 'border-color 120ms, background 120ms',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f9ff'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff'; }}
            >
              {/* Left: icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 0,
                  background: isActive ? T.accent : T.surface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={16} style={{ color: isActive ? '#fff' : T.textMuted }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: 0 }}>{dept.name}</p>
                </div>
              </div>

              {/* Right: delete + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={(e) => handleDelete(dept, e)}
                  title="Delete department"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.textMuted, padding: 4, display: 'flex', alignItems: 'center', borderRadius: 4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T.danger}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={14} style={{ color: T.textMuted, transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right: Inspector Drawer ───────────────────────────────────────── */}
      {selectedDeptId && (
        <DepartmentInspectorDrawer
          deptId={selectedDeptId}
          allUsers={allUsers}
          onClose={() => setSelectedDeptId(null)}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateDepartmentModal
          allUsers={allUsers}
          onClose={() => setShowCreate(false)}
        />
      )}

      {deptToDelete && (
        <DeleteConfirmModal
          dept={deptToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setDeptToDelete(null)}
          isPending={deleteDept.isPending}
        />
      )}
    </div>
  );
}
