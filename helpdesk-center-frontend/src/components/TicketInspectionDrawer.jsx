/**
 * TicketInspectionDrawer — shared read-only ticket inspection panel.
 *
 * Used by:
 *   - TeammateWorkspacePage (agent/manager viewing a peer's workspace)
 *   - ManagerQueueTable     (manager clicking a ticket row in the queue)
 *   - AnalyticsPanel        (admin inspecting a ticket inline)
 *
 * Props:
 *   selectedTicketId  — ticket ID to load, or null to show empty state
 *   onTakeOver(ticket) — called when the "Take Over" button is clicked
 *   isManager         — if true, shows the reassignment dropdown instead of read-only agent display
 *   team              — array of TeamMemberResponse objects for the dropdown
 *   hideTakeOver      — if true, hides the entire footer (take-over button + warning)
 */
import { useState } from 'react';
import StatusBadge   from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { useTicket, useReassignTicket } from '../hooks/useTickets';
import { useMessages } from '../hooks/useMessages';
import { AlertTriangle, UserCheck } from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function agentInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── style constants ─────────────────────────────────────────────────────── */
const drawerStyle = {
  height: '100%',
  background: '#ffffff',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 0,
};

const sectionLabelStyle = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#76777d',
  marginBottom: 8, margin: '0 0 8px',
};

/* ── component ───────────────────────────────────────────────────────────── */
export default function TicketInspectionDrawer({ selectedTicketId, onTakeOver, isManager = false, team = [], hideTakeOver = false }) {
  const { data: ticket, isLoading } = useTicket(selectedTicketId);
  const { data: messages = [] }     = useMessages(selectedTicketId);
  const reassign                    = useReassignTicket();

  const [pendingAgentId, setPendingAgentId] = useState(null);
  const [saveSuccess,    setSaveSuccess]    = useState(false);
  const [lastTicketId,   setLastTicketId]   = useState(null);

  /* Reset when selected ticket changes */
  const ticketId = ticket?.id ?? null;
  if (ticketId !== lastTicketId) {
    setLastTicketId(ticketId);
    setPendingAgentId(null);
    setSaveSuccess(false);
  }

  const currentAgentId   = ticket?.assignee?.id ?? '';
  const effectiveAgentId = pendingAgentId !== null ? pendingAgentId : String(currentAgentId);
  const isDirty          = pendingAgentId !== null && String(pendingAgentId) !== String(currentAgentId);

  const handleSaveAssignment = () => {
    if (!ticket || !isDirty) return;
    reassign.mutate(
      { id: ticket.id, agentId: pendingAgentId === '' ? null : Number(pendingAgentId) },
      {
        onSuccess: () => {
          setPendingAgentId(null);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        },
      }
    );
  };

  /* Empty state */
  if (!selectedTicketId) {
    return (
      <aside style={drawerStyle}>
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
            Ticket Inspection
          </span>
        </div>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: 24, textAlign: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="1" y="1" width="30" height="30" rx="4" stroke="#e2e8f0" strokeWidth="1.5"/>
            <path d="M10 11h12M10 16h8M10 21h5" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>No ticket selected</div>
          <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5 }}>
            Click any row in the table<br />to inspect its details here.
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside style={drawerStyle}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
          Ticket Inspection
        </span>
        {ticket && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#94a3b8' }}>
            #{ticket.id}
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Loading ticket…</p>
        ) : !ticket ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Ticket not found.</p>
        ) : (
          <>
            {/* Title */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0b1c30', lineHeight: '22px', margin: '0 0 12px' }}>
              {ticket.title}
            </h2>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>

            {/* Assigned Agent */}
            <div style={{ marginBottom: 20 }}>
              <p style={sectionLabelStyle}>Assigned Agent</p>
              {isManager ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={effectiveAgentId}
                    onChange={(e) => setPendingAgentId(e.target.value)}
                    style={{
                      flex: 1, height: 32, padding: '0 8px',
                      border: `1px solid ${isDirty ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: 4, fontSize: 12, color: '#0f172a',
                      background: '#fff', outline: 'none', cursor: 'pointer',
                      transition: 'border-color 150ms',
                    }}
                  >
                    <option value="">— Unassigned —</option>
                    {team.map(m => (
                      <option key={m.id} value={String(m.id)}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveAssignment}
                    disabled={!isDirty || reassign.isPending}
                    style={{
                      height: 32, padding: '0 12px',
                      background: saveSuccess ? '#16a34a' : isDirty ? '#0f172a' : '#e2e8f0',
                      border: 'none', borderRadius: 4,
                      fontSize: 11, fontWeight: 700,
                      color: isDirty || saveSuccess ? '#ffffff' : '#94a3b8',
                      cursor: isDirty && !reassign.isPending ? 'pointer' : 'not-allowed',
                      flexShrink: 0, transition: 'background 200ms',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {reassign.isPending ? '…' : saveSuccess ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                        Saved
                      </>
                    ) : 'Save'}
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: 4,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: '#1e293b', border: '1.5px solid #334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#94a3b8',
                  }}>
                    {agentInitials(ticket.assignee?.name)}
                  </div>
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                    {ticket.assignee?.name ?? <em style={{ color: '#94a3b8' }}>Unassigned</em>}
                  </span>
                </div>
              )}
              {reassign.isError && (
                <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, margin: '4px 0 0' }}>
                  {reassign.error?.response?.data?.message ?? 'Reassignment failed.'}
                </p>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <p style={sectionLabelStyle}>Description</p>
              <div style={{
                padding: '12px 14px', background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 13, lineHeight: '20px', color: '#45464d',
              }}>
                {ticket.description || <em style={{ color: '#94a3b8' }}>No description provided.</em>}
              </div>
            </div>

            {/* Activity log — greyed, read-only */}
            <div style={{ opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }}>
              <p style={sectionLabelStyle}>Activity Log</p>
              {messages.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>No activity yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: msg.authorRole === 'SYSTEM' ? '#bfdbfe' : '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#475569',
                      }}>
                        {msg.authorRole === 'SYSTEM' ? 'SB' : agentInitials(msg.authorName)}
                      </div>
                      <div style={{ flex: 1, background: '#f1f5f9', padding: '8px 10px', borderRadius: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{msg.authorName ?? 'Unknown'}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>{fmtTime(msg.createdAt)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: '#475569' }}>
                          {msg.message ?? msg.body ?? msg.content ?? ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer — hidden when hideTakeOver is set */}
      {!hideTakeOver && (
        <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertTriangle size={12} color="#b45309" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 11, color: '#92400e', lineHeight: '15px' }}>
              {isManager
                ? 'Use the dropdown above to reassign, or take over this ticket yourself.'
                : 'Reply disabled — take over to post comments or modify this ticket.'}
            </p>
          </div>
          <button
            onClick={() => ticket && onTakeOver(ticket)}
            disabled={!ticket}
            style={{
              width: '100%', padding: '8px 0',
              background: '#0f172a', border: 'none', color: '#ffffff',
              fontSize: 12, fontWeight: 700, cursor: ticket ? 'pointer' : 'not-allowed',
              borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: ticket ? 1 : 0.4,
            }}
            onMouseEnter={(e) => { if (ticket) e.currentTarget.style.background = '#1e293b'; }}
            onMouseLeave={(e) => { if (ticket) e.currentTarget.style.background = '#0f172a'; }}
          >
            <UserCheck size={13} />
            Take Over This Ticket
          </button>
        </div>
      )}
    </aside>
  );
}
