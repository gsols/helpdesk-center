/**
 * AgentDashboard — wireframe "agent_workspace_panel_actions_support_engine_1 + _2"
 *
 * Layout: Full-height 3-pane workspace
 *  Left (380px): Search bar + My Queue / Dept Pool / Archive tabs + ticket list
 *  Center (fluid): Ticket header (TCK-XXXX / dept, title, reporter, SLA bar) + description card + comment thread + reply box
 *  Right (270px): PRIMARY ACTIONS + CUSTOMER INSIGHTS + TICKET METADATA + RECENT ACTIVITY
 *
 * Uses:  useMyQueue, usePool, useArchive, useRerouteTicket, useUpdateStatus
 */
import { useState } from 'react';
import { useAuth }        from '../context/AuthContext';
import { useMyQueue, usePool, useArchive, useUpdateStatus, useRerouteTicket } from '../hooks/useTickets';
import StatusBadge    from '../components/StatusBadge';
import PriorityBadge  from '../components/PriorityBadge';
import CommentSection from '../components/CommentSection';
import RerouteModal   from '../components/RerouteModal';
import SlaProgressBar from '../components/SlaProgressBar';
import {
  Search, Filter, ArrowLeftRight, CheckCircle, ChevronRight,
  Cpu, LayoutGrid, AlertTriangle,
} from 'lucide-react';

const TABS = ['My Queue', 'Dept Pool', 'Archive'];

function getInitials(name) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
}

function relTime(d) {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

/* ── Left pane: ticket list ──────────────────────────────────────────────── */
function TicketListPane({ tab, onTabChange, tickets, selectedId, onSelect, query, onQuery }) {
  return (
    <div style={{
      width: 380, flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 10px', height: 34 }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tickets…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#0f172a' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 14px' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            style={{
              padding: '10px 12px',
              fontSize: 13, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? '#0f172a' : '#64748b',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #0f172a' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '10px 0' }}>
          <Filter size={14} color="#94a3b8" />
        </div>
      </div>

      {/* Ticket count */}
      <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
        {tickets.length} Tickets
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tickets.length === 0 && (
          <div style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No tickets in this queue.
          </div>
        )}
        {tickets.filter(t => !query || t.title?.toLowerCase().includes(query.toLowerCase())).map((ticket) => {
          const active = ticket.id === selectedId;
          return (
            <div
              key={ticket.id}
              onClick={() => onSelect(ticket)}
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid #f1f5f9',
                borderLeft: active ? '3px solid #0f172a' : '3px solid transparent',
                background: active ? '#f8fafc' : 'transparent',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Ticket ID + priority */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  #SR-{ticket.id}
                </span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              {/* Title */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: '18px', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ticket.title}
              </div>
              {/* Footer: avatar + name + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {ticket.reporter?.name ? (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                    {getInitials(ticket.reporter.name)}
                  </div>
                ) : null}
                <span style={{ fontSize: 12, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ticket.reporter?.name ?? 'Unknown'}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{relTime(ticket.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Right action pane ───────────────────────────────────────────────────── */
function RightPane({ ticket, onReroute, onMarkResolved }) {
  if (!ticket) {
    return (
      <div style={{ width: 270, background: '#f8fafc', borderLeft: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, padding: 16, textAlign: 'center' }}>
        Select a ticket to see actions
      </div>
    );
  }

  const initials = getInitials(ticket.reporter?.name);

  return (
    <div style={{ width: 270, flexShrink: 0, background: '#f8fafc', borderLeft: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      {/* PRIMARY ACTIONS */}
      <div style={rpSectionStyle}>
        <div style={rpHeaderStyle}>PRIMARY ACTIONS</div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onReroute}
            style={{
              width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6,
              fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeftRight size={15} />
              <span>Re-Route</span>
            </div>
            <ChevronRight size={14} color="#94a3b8" />
          </button>
          <button
            onClick={onMarkResolved}
            style={{
              width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
              background: '#0f172a', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 700, color: '#ffffff', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} />
              <span>Mark Resolved</span>
            </div>
            <CheckCircle size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
      </div>

      {/* CUSTOMER INSIGHTS */}
      <div style={rpSectionStyle}>
        <div style={rpHeaderStyle}>CUSTOMER INSIGHTS</div>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{ticket.reporter?.name ?? 'Unknown'}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{ticket.reporter?.role ?? 'Employee'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InsightRow label="Organization" value={ticket.reporter?.companyId ? `Tenant #${ticket.reporter.companyId}` : '—'} />
            <InsightRow label="Location"     value="—" />
          </div>
        </div>
      </div>

      {/* TICKET METADATA */}
      <div style={rpSectionStyle}>
        <div style={rpHeaderStyle}>TICKET METADATA</div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={rpMetaLabel}>ASSIGNED AGENT</div>
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', height: 32, alignItems: 'center', paddingLeft: 10, paddingRight: 8, fontSize: 13, color: '#0f172a' }}>
              <span style={{ flex: 1 }}>{ticket.assignee?.name ?? 'Agent Alpha (Me)'}</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>▾</span>
            </div>
          </div>
          <div>
            <div style={rpMetaLabel}>DEPARTMENT</div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, height: 32, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 13, color: '#0f172a' }}>
              {ticket.department?.name ?? ticket.departmentName ?? '—'}
            </div>
          </div>
          <div>
            <div style={rpMetaLabel}>TAGS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(ticket.tags ?? ['VPN', 'CONNECTIVITY']).map((tag) => (
                <span key={tag} style={{ padding: '2px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  {tag}
                </span>
              ))}
              <button style={{ padding: '2px 8px', background: '#f1f5f9', border: '1px dashed #e2e8f0', borderRadius: 4, fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>
                + ADD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div style={{ ...rpSectionStyle, borderBottom: 'none' }}>
        <div style={rpHeaderStyle}>RECENT ACTIVITY</div>
        <div style={{ padding: '8px 16px' }}>
          {[
            { color: '#3b82f6', text: 'Ticket opened by John Doe',   time: 'Today at 10:42 AM' },
            { color: '#94a3b8', text: 'Agent Alpha assigned',        time: 'Today at 10:43 AM' },
            { color: '#f59e0b', text: 'Status: Pending Employee',    time: 'Today at 10:45 AM' },
          ].map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: '#374151' }}>{ev.text}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── AgentDashboard ──────────────────────────────────────────────────────── */
export default function AgentDashboard() {
  const { user } = useAuth();
  const [tab,           setTab]           = useState('My Queue');
  const [selectedTicket,setSelectedTicket]= useState(null);
  const [query,         setQuery]         = useState('');
  const [rerouteOpen,   setRerouteOpen]   = useState(false);
  const [replyText,     setReplyText]     = useState('');

  const { data: myQueue  = [] } = useMyQueue();
  const { data: deptPool = [] } = usePool();
  const { data: archive  = [] } = useArchive();
  const updateStatus  = useUpdateStatus();
  const rerouteTicket = useRerouteTicket();

  const ticketMap = { 'My Queue': myQueue, 'Dept Pool': deptPool, 'Archive': archive };
  const tickets   = ticketMap[tab] ?? [];

  const handleMarkResolved = () => {
    if (!selectedTicket) return;
    updateStatus.mutate({ id: selectedTicket.id, status: 'RESOLVED' });
  };

  const t = selectedTicket;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>

      {/* Left pane */}
      <TicketListPane
        tab={tab}
        onTabChange={(v) => { setTab(v); setSelectedTicket(null); }}
        tickets={tickets}
        selectedId={t?.id}
        onSelect={setSelectedTicket}
        query={query}
        onQuery={setQuery}
      />

      {/* Center pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff', minWidth: 0 }}>

        {!t ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, flexDirection: 'column', gap: 8 }}>
            <LayoutGrid size={32} color="#e2e8f0" />
            Select a ticket from the queue to begin
          </div>
        ) : (
          <>
            {/* Ticket header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              {/* Breadcrumb: TCK-XXXX / Department */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#475569' }}>
                  TCK-{t.id}
                </span>
                <span style={{ color: '#94a3b8' }}>/</span>
                <span style={{ color: '#64748b' }}>{t.department?.name ?? '—'}</span>
              </div>
              {/* Status + priority badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                {t.status === 'PENDING_EMPLOYEE' && (
                  <span style={{ padding: '2px 8px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#c2410c' }}>
                    PENDING_EMPLOYEE
                  </span>
                )}
              </div>
              {/* Title */}
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: '24px' }}>
                {t.title}
              </h1>
              {/* Reporter + date */}
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                Reported by <strong style={{ color: '#374151' }}>{t.reporter?.name ?? 'Unknown'}</strong>
                {t.reporter?.departmentName && ` (${t.reporter.departmentName})`}
                {t.createdAt && ` · Created ${new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </div>
              {/* SLA bar */}
              <SlaProgressBar ticket={t} />
            </div>

            {/* Description card */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>TICKET DESCRIPTION</span>
                <button style={{ background: 'transparent', border: 'none', fontSize: 11, fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}>MINIMIZE ▲</button>
              </div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: '20px', margin: 0 }}>
                {t.description ?? 'No description provided.'}
              </p>
            </div>

            {/* Comment thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <CommentSection ticketId={t.id} ticket={t} />
            </div>

            {/* Reply box */}
            <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 20px', flexShrink: 0, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['B','I','🔗','📎','≡'].map((icon, i) => (
                    <button key={i} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', fontSize: 14, borderRadius: 4 }}>{icon}</button>
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>REPLYING AS AGENT ALPHA</span>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response…"
                rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', background: 'transparent', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ borderRadius: 3 }} />
                  Internal Note
                </label>
                <button
                  style={{ height: 34, padding: '0 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Send Reply ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right pane */}
      <RightPane
        ticket={t}
        onReroute={() => setRerouteOpen(true)}
        onMarkResolved={handleMarkResolved}
      />

      {/* Reroute modal */}
      {rerouteOpen && t && (
        <RerouteModal
          ticket={t}
          onClose={() => setRerouteOpen(false)}
          onSubmit={(deptId) => {
            rerouteTicket.mutate({ id: t.id, targetDepartmentId: deptId });
            setRerouteOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */
function InsightRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const rpSectionStyle = { borderBottom: '1px solid #e2e8f0' };
const rpHeaderStyle = {
  padding: '10px 16px', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
};
const rpMetaLabel = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4,
};
