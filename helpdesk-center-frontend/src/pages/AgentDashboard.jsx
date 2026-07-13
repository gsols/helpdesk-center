/**
 * AgentDashboard — agent workspace with three queue tabs.
 *
 * Layout: AppShell (noPadding) → AgentQueueSidebar (collapsible, drag-resize)
 *         + right pane — context-sensitive per active tab:
 *             My Queue  → TicketDetailPanel (full chat + actions)
 *             Dept Pool → DeptPoolInspectionPanel (read-only + Assign to Me)
 *             Archive   → TicketInspectionDrawer  (read-only + Take Over)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import AgentQueueSidebar from '../components/AgentQueueSidebar';
import TicketDetailPanel from '../components/TicketDetailPanel';
import TicketInspectionDrawer from '../components/TicketInspectionDrawer';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useMyQueue, usePool, useArchive, useAssignToMe, useRequestTakeover } from '../hooks/useTickets';
import { useTicket } from '../hooks/useTickets';
import { useMessages } from '../hooks/useMessages';
import { AlertTriangle, UserCheck, Clock, X } from 'lucide-react';

const LIST_MIN     = 200;
const LIST_MAX     = 500;
const LIST_DEFAULT = 280;

/* ── shared style helpers ────────────────────────────────────────────────── */

const drawerStyle = {
  flex: 1,
  borderLeft: '1px solid #e2e8f0',
  background: '#ffffff',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
  minHeight: 0,
  minWidth: 0,
};

const sectionLabelStyle = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#76777d',
  margin: '0 0 8px',
};

function agentInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── DeptPoolInspectionPanel ─────────────────────────────────────────────── */

function DeptPoolInspectionPanel({ selectedTicketId, onAssignToMe, isPending }) {
  const { data: ticket, isLoading } = useTicket(selectedTicketId);
  const { data: messages = [] }     = useMessages(selectedTicketId);

  if (!selectedTicketId) {
    return (
      <aside style={drawerStyle}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
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

      {/* Footer — Assign to Me */}
      <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0, padding: '10px 12px' }}>
        <button
          onClick={() => ticket && onAssignToMe(ticket)}
          disabled={!ticket || isPending}
          style={{
            width: '100%', padding: '8px 0',
            background: '#0f172a', border: 'none', color: '#ffffff',
            fontSize: 12, fontWeight: 700,
            cursor: ticket && !isPending ? 'pointer' : 'not-allowed',
            borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: ticket && !isPending ? 1 : 0.4,
          }}
          onMouseEnter={(e) => { if (ticket && !isPending) e.currentTarget.style.background = '#1e293b'; }}
          onMouseLeave={(e) => { if (ticket && !isPending) e.currentTarget.style.background = '#0f172a'; }}
        >
          <UserCheck size={13} />
          {isPending ? 'Assigning…' : 'Assign to Me'}
        </button>
      </div>
    </aside>
  );
}

/* ── TakeOverRequestModal ────────────────────────────────────────────────── */

function TakeOverRequestModal({ ticket, onConfirm, onCancel, isPending }) {
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
        <button
          onClick={onCancel}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, flexShrink: 0 }}>
            <Clock size={18} color="#ffffff" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0b1c30', margin: 0, lineHeight: '20px' }}>
              Request Ticket Takeover
            </p>
            <p style={{ fontSize: 11, color: '#76777d', margin: 0 }}>
              Your department manager must approve this request.
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: '#fffbeb', border: '1px solid #fcd34d',
          padding: '10px 14px', marginBottom: 20,
        }}>
          <AlertTriangle size={14} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: '18px' }}>
            <strong>#{ticket?.id}</strong> — <em>{ticket?.title}</em>
            <br />
            This will notify your manager. The ticket will show <strong>Pending Approval</strong> until they decide.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#ffffff', border: '1px solid #e5e7eb', color: '#0b1c30',
              borderRadius: 3, opacity: isPending ? 0.5 : 1,
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
              borderRadius: 3, opacity: isPending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = '#1e293b'; }}
            onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.background = '#0f172a'; }}
          >
            <Clock size={14} />
            {isPending ? 'Sending request…' : 'Send Takeover Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── AgentDashboard ──────────────────────────────────────────────────────── */

export default function AgentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: myQueue = [] } = useMyQueue();
  const { data: pool    = [] } = usePool();
  const { data: archive = [] } = useArchive();
  const assignToMe      = useAssignToMe();
  const requestTakeover = useRequestTakeover();
  /* tracks archive ticket IDs where a gated request has been sent this session */
  const [archivePendingIds, setArchivePendingIds] = useState(new Set());

  const [listCollapsed, setListCollapsed] = useState(false);
  const [listWidth,     setListWidth]     = useState(LIST_DEFAULT);
  const [activeTab,     setActiveTab]     = useState('My Queue');
  const [poolSelectedId,    setPoolSelectedId]    = useState(null);
  const [archiveSelectedId, setArchiveSelectedId] = useState(null);
  const [modalTicket, setModalTicket] = useState(null);

  const dragStartX = useRef(null);
  const dragStartW = useRef(null);

  const isPool    = activeTab === 'Dept Pool';
  const isArchive = activeTab === 'Archive';

  const handleToggle = useCallback(() => {
    setListCollapsed(prev => !prev);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = listWidth;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const delta = ev.clientX - dragStartX.current;
      setListWidth(Math.min(LIST_MAX, Math.max(LIST_MIN, dragStartW.current + delta)));
    };
    const onUp = () => {
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, [listWidth]);

  useEffect(() => {
    window.addEventListener('tickets-tab-click', handleToggle);
    return () => window.removeEventListener('tickets-tab-click', handleToggle);
  }, [handleToggle]);

  // Auto-select first ticket in My Queue when no ticket is open
  useEffect(() => {
    if (!isPool && !isArchive && !id && myQueue.length > 0) {
      navigate(`/agent/${myQueue[0].id}`, { replace: true });
    }
  }, [id, myQueue, navigate, isPool, isArchive]);

  // Auto-select first pool ticket when switching to Dept Pool
  useEffect(() => {
    if (isPool && poolSelectedId === null && pool.length > 0) {
      setPoolSelectedId(pool[0].id);
    }
  }, [isPool, pool, poolSelectedId]);

  // Auto-select first archive ticket when switching to Archive
  useEffect(() => {
    if (isArchive && archiveSelectedId === null && archive.length > 0) {
      setArchiveSelectedId(archive[0].id);
    }
  }, [isArchive, archive, archiveSelectedId]);

  /* Pool — assign to me and navigate into the ticket */
  const handleAssignToMe = useCallback((ticket) => {
    assignToMe.mutate(ticket.id, {
      onSuccess: () => {
        setActiveTab('My Queue');
        setPoolSelectedId(null);
        navigate(`/agent/${ticket.id}`);
      },
    });
  }, [assignToMe, navigate]);

  /* Archive — take-over modal */
  const handleTakeOver = useCallback((ticket) => {
    setModalTicket(ticket);
  }, []);

  const handleConfirmTakeOver = useCallback(() => {
    if (!modalTicket) return;
    requestTakeover.mutate(modalTicket.id, {
      onSuccess: () => {
        setArchivePendingIds((prev) => new Set(prev).add(modalTicket.id));
        setModalTicket(null);
      },
    });
  }, [modalTicket, requestTakeover]);

  const handleCancelTakeOver = useCallback(() => {
    setModalTicket(null);
  }, []);

  const effectivePoolId    = poolSelectedId    ?? (pool.length    > 0 ? pool[0].id    : null);
  const effectiveArchiveId = archiveSelectedId ?? (archive.length > 0 ? archive[0].id : null);

  /* Which ticket id is highlighted in the sidebar */
  const sidebarActiveId = isPool ? effectivePoolId : isArchive ? effectiveArchiveId : id;

  return (
    <AppShell title="Agent Workspace" noPadding panelToggle={handleToggle} panelCollapsed={listCollapsed}>
      <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>

        <AgentQueueSidebar
          activeTicketId={sidebarActiveId}
          collapsed={listCollapsed}
          onToggle={handleToggle}
          width={listWidth}
          onDragHandleMouseDown={handleDragStart}
          onTabChange={handleTabChange}
          onPoolSelect={setPoolSelectedId}
          onArchiveSelect={setArchiveSelectedId}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#fff' }}>
          {isPool ? (
            <DeptPoolInspectionPanel
              selectedTicketId={effectivePoolId}
              onAssignToMe={handleAssignToMe}
              isPending={assignToMe.isPending}
            />
          ) : isArchive ? (
            <TicketInspectionDrawer
              selectedTicketId={effectiveArchiveId}
              onTakeOver={handleTakeOver}
              isManager={false}
              team={[]}
              takeoverPending={archivePendingIds.has(effectiveArchiveId)}
            />
          ) : id ? (
            <TicketDetailPanel ticketId={id} />
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
              color: '#94a3b8', fontSize: 13,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Select a ticket from the queue to begin
            </div>
          )}
        </div>

      </div>

      {modalTicket && (
        <TakeOverRequestModal
          ticket={modalTicket}
          onConfirm={handleConfirmTakeOver}
          onCancel={handleCancelTakeOver}
          isPending={requestTakeover.isPending}
        />
      )}
    </AppShell>
  );
}
