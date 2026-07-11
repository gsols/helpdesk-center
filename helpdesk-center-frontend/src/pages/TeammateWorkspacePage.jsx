/**
 * TeammateWorkspacePage — read-only view of a peer agent's active ticket queue.
 *
 * Layout:
 *   AppShell → context banner (agent info + read-only badge)
 *             → horizontal split:
 *                 left:  ticket grid table (OPEN / IN_PROGRESS tickets for this peer)
 *                 right: inspection drawer (ticket detail + take-over CTA)
 *
 * Data strategy:
 *   - Peer info   → useAgentById(peerId)  (derived from /api/users/team, no extra call)
 *   - Ticket list → usePeerQueue(peerId)  (derived from /api/tickets/archive, filtered client-side)
 *   - Ticket body → useTicket(selectedId) (existing endpoint, loaded on row click)
 *   - Messages    → useMessages(selectedId) (existing endpoint, for activity log)
 */
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAgentById } from '../hooks/useUsers';
import { usePeerQueue, useTicket, useAssignToMe } from '../hooks/useTickets';
import { useMessages } from '../hooks/useMessages';
import { ChevronLeft, Eye, AlertTriangle, UserCheck, X } from 'lucide-react';

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

/* ── TakeOverModal ───────────────────────────────────────────────────────── */

function TakeOverModal({ ticket, onConfirm, onCancel, isPending }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        width: 420,
        padding: '28px 28px 24px',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onCancel}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <X size={16} />
        </button>

        {/* Icon row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, flexShrink: 0 }}>
            <UserCheck size={18} color="#ffffff" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0b1c30', margin: 0, lineHeight: '20px' }}>
              Take Over This Ticket
            </p>
            <p style={{ fontSize: 11, color: '#76777d', margin: 0 }}>
              This action will reassign the ticket to you.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: '#fffbeb', border: '1px solid #fcd34d',
          padding: '10px 14px', marginBottom: 20,
        }}>
          <AlertTriangle size={14} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: '18px' }}>
            <strong>#{ticket?.id}</strong> — <em>{ticket?.title}</em>
            <br />
            You will become the assigned agent for this ticket. The current assignee will lose write access.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#ffffff', border: '1px solid #e5e7eb', color: '#0b1c30',
              borderRadius: 3,
              opacity: isPending ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
              background: '#0f172a', border: 'none', color: '#ffffff',
              borderRadius: 3,
              opacity: isPending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = '#1e293b'; }}
            onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.background = '#0f172a'; }}
          >
            <UserCheck size={14} />
            {isPending ? 'Taking over…' : 'Confirm Take Over'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── InspectionDrawer ────────────────────────────────────────────────────── */

function InspectionDrawer({ selectedTicketId, onTakeOver }) {
  const { data: ticket, isLoading } = useTicket(selectedTicketId);
  const { data: messages = [] }     = useMessages(selectedTicketId);

  if (!selectedTicketId) {
    return (
      <aside style={drawerStyle}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30', margin: 0 }}>Ticket Inspection</p>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>
          Select a ticket to inspect
        </div>
      </aside>
    );
  }

  return (
    <aside style={drawerStyle}>
      {/* Drawer header — same padding as thStyle so heights align */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #e5e7eb',
        background: '#f8fafc', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
          Ticket Inspection
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Loading ticket…</p>
        ) : !ticket ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Ticket not found.</p>
        ) : (
          <>
            {/* ID + Title */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                color: '#76777d', background: '#e5eeff', padding: '1px 7px', borderRadius: 3,
                flexShrink: 0,
              }}>
                #{ticket.id}
              </span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0b1c30', lineHeight: '22px', margin: 0 }}>
                {ticket.title}
              </h2>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>

            {/* Core description */}
            <div style={{ marginBottom: 20 }}>
              <p style={sectionLabelStyle}>Core Description</p>
              <div style={{
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                fontSize: 13, lineHeight: '20px', color: '#45464d',
              }}>
                {ticket.description || <em style={{ color: '#94a3b8' }}>No description provided.</em>}
              </div>
            </div>

            {/* Activity log — greyed out, read-only */}
            <div style={{ opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }}>
              <p style={sectionLabelStyle}>Activity Log</p>
              {messages.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>No activity yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: msg.authorRole === 'SYSTEM' ? '#bfdbfe' : '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#475569',
                      }}>
                        {msg.authorRole === 'SYSTEM' ? 'SB' : agentInitials(msg.authorName)}
                      </div>
                      {/* Bubble */}
                      <div style={{ flex: 1, background: '#f1f5f9', padding: '8px 10px', borderRadius: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                            {msg.authorName ?? 'Unknown'}
                          </span>
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

      {/* Compact footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', background: '#f8fafc', flexShrink: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Read-only notice — single line */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <AlertTriangle size={12} color="#b45309" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 11, color: '#92400e', lineHeight: '15px' }}>
            Reply disabled — take over to post comments or modify this ticket.
          </p>
        </div>

        {/* CTA */}
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
    </aside>
  );
}

/* ── TeammateWorkspacePage ───────────────────────────────────────────────── */

export default function TeammateWorkspacePage() {
  const { peerId }   = useParams();
  const navigate     = useNavigate();
  const [selectedId, setSelectedId]   = useState(null);
  const [modalTicket, setModalTicket] = useState(null);

  const { data: peer, isLoading: peerLoading } = useAgentById(peerId);
  const { data: tickets = [], isLoading: ticketsLoading } = usePeerQueue(peerId);
  const assignToMe = useAssignToMe();

  // Auto-select the first ticket once the list loads
  useEffect(() => {
    if (!ticketsLoading && tickets.length > 0 && selectedId === null) {
      setSelectedId(tickets[0].id);
    }
  }, [ticketsLoading, tickets, selectedId]);

  const handleRowClick = useCallback((id) => setSelectedId(id), []);

  const handleTakeOver = useCallback((ticket) => {
    setModalTicket(ticket);
  }, []);

  const handleConfirmTakeOver = useCallback(() => {
    if (!modalTicket) return;
    assignToMe.mutate(modalTicket.id, {
      onSuccess: () => {
        setModalTicket(null);
        navigate(`/agent/${modalTicket.id}`);
      },
    });
  }, [modalTicket, assignToMe, navigate]);

  const handleCancelTakeOver = useCallback(() => {
    setModalTicket(null);
  }, []);

  const peerName = peer?.name ?? (peerLoading ? 'Loading…' : `Agent #${peerId}`);
  const peerDept = peer?.departmentName ?? '';

  return (
    <AppShell title="Teammate Workspace" noPadding>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Context banner ──────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 24px',
          background: '#f0f4ff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Back to Team — sits above the avatar row */}
            <button
              onClick={() => navigate('/agent/team')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#76777d', fontSize: 11, fontWeight: 600,
                padding: 0, alignSelf: 'flex-start',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0b1c30'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#76777d'; }}
            >
              <ChevronLeft size={14} />
              Back to Team
            </button>

            {/* Avatar + info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 4,
                  background: '#131b2e',
                  border: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#bec6e0',
                }}>
                  {agentInitials(peer?.name)}
                </div>
                <div style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 10, height: 10, background: '#10b981',
                  border: '2px solid #ffffff', borderRadius: '50%',
                }} />
              </div>

              {/* Info */}
              <div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0b1c30', margin: '0 0 2px', lineHeight: '20px' }}>
                  Teammate Workspace: {peerName}
                </h1>
                <p style={{ fontSize: 12, color: '#76777d', margin: 0 }}>
                  Displaying all active tickets assigned to this agent within your shared {peerDept} department.
                </p>
              </div>
            </div>
          </div>

          {/* Read-only badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '2px solid #d97706',
            background: '#fffbeb',
            color: '#92400e',
            padding: '6px 14px',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            <Eye size={14} />
            [ Read-Only Mode: Peer Assigned Workspace ]
          </div>
        </div>

        {/* ── Horizontal split ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ── Ticket grid ───────────────────────────────────────────────── */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
            {ticketsLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                Loading tickets…
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  No active tickets assigned to this agent.
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['Ticket ID', 'Subject', 'Status', 'Priority'].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const isSelected = String(t.id) === String(selectedId);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => handleRowClick(t.id)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 100ms',
                          borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent'; }}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', fontFamily: "'JetBrains Mono', monospace" }}>
                            #TK-{t.id}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#0b1c30' }}>{t.title}</td>
                        <td style={tdStyle}><StatusBadge status={t.status} /></td>
                        <td style={tdStyle}><PriorityBadge priority={t.priority} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* ── Inspection drawer — only when there are tickets ───────────── */}
          {!ticketsLoading && tickets.length > 0 && (
            <InspectionDrawer
              selectedTicketId={selectedId}
              onTakeOver={handleTakeOver}
            />
          )}
        </div>
      </div>

      {/* ── Take-over confirmation modal ──────────────────────────────────── */}
      {modalTicket && (
        <TakeOverModal
          ticket={modalTicket}
          onConfirm={handleConfirmTakeOver}
          onCancel={handleCancelTakeOver}
          isPending={assignToMe.isPending}
        />
      )}
    </AppShell>
  );
}

/* ── Style constants ──────────────────────────────────────────────────────── */

const drawerStyle = {
  width: 420, flexShrink: 0,
  borderLeft: '1px solid #e5e7eb',
  background: '#ffffff',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
  minHeight: 0,
  alignSelf: 'stretch',
};

const thStyle = {
  padding: '10px 16px',
  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#64748b',
  borderBottom: '1px solid #e5e7eb',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 13,
};

const sectionLabelStyle = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#76777d',
  marginBottom: 8,
};
