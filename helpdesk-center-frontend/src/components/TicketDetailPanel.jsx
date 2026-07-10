/**
 * TicketDetailPanel — "employee_ticket_detail_refined_layout" wireframe
 *
 * Layout: 2-column view (fills TicketDetailPage's content area)
 *  Center (fluid):
 *    • Ticket header: large #TK-ID / Title + status/priority badges + SLA bar
 *    • Scrollable conversation thread (CommentSection)
 *  Right (280px):
 *    • AI Classification
 *    • Ticket Metadata
 *    • Attachments
 *    • Recent Activity (timeline)
 *    • Tags
 */
import { useState, useEffect, useMemo } from 'react';
import { useTicket, useUpdateStatus } from '../hooks/useTickets';
import { getAttachments } from '../api/attachmentsApi';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CommentSection from './CommentSection';
import SlaProgressBar from './SlaProgressBar';
import { FileText, ImageIcon, Plus, Sparkles } from 'lucide-react';

/* ── SLA remaining time helper (mirrors SlaProgressBar logic) ─────────────── */
function useSlaRemaining(createdAt, dueAt) {
  return useMemo(() => {
    if (!createdAt || !dueAt) return null;
    const now     = Date.now();
    const created = new Date(createdAt).getTime();
    const due     = new Date(dueAt).getTime();
    const total   = due - created;
    const ms      = Math.max(0, due - now);
    if (ms === 0) return { label: 'BREACHED', color: '#dc2626' };
    const h         = Math.floor(ms / 3600000);
    const m         = Math.floor((ms % 3600000) / 60000);
    const label     = h > 0 ? `${h}H ${m}M REMAINING` : `${m}M REMAINING`;
    const remaining = total > 0 ? (ms / total) * 100 : 0;
    const color     = remaining < 25 ? '#dc2626' : remaining < 50 ? '#d97706' : '#45464d';
    return { label, color };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, dueAt]);
}

/* ── Attachment icon ──────────────────────────────────────────────────────── */
function AttachIcon({ fileName }) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext))
    return (
      <div style={{ width: 40, height: 40, background: '#dce9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ImageIcon size={16} color="#dc2626" />
      </div>
    );
  return (
    <div style={{ width: 40, height: 40, background: '#e5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FileText size={16} color="#565e74" />
    </div>
  );
}

/* ── AI Classification confidence data (mocked) ───────────────────────────── */
const AI_CLASSES = [
  { label: 'Security',   pct: 92, primary: true  },
  { label: 'IT Support', pct: 8,  primary: false },
];

export default function TicketDetailPanel({ ticketId }) {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const updateStatus = useUpdateStatus();
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (!ticketId) return;
    getAttachments(ticketId).then(r => setAttachments(r.data ?? [])).catch(() => {});
  }, [ticketId]);

  if (isLoading || !ticket) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        {isLoading ? 'Loading ticket…' : 'Select a ticket to view details'}
      </div>
    );
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · '
      + new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Center: main content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Ticket header ─────────────────────────────────────────────── */}
        <TicketHeader ticket={ticket} />

        {/* ── Scrollable conversation ────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f8f9ff' }}>
          <CommentSection ticketId={ticketId} ticket={ticket} />
        </div>
      </div>

      {/* ── Right sidebar ────────────────────────────────────────────────── */}
      <div style={{
        width: 260, flexShrink: 0,
        borderLeft: '1px solid #e5e7eb',
        background: '#ffffff',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── AI CLASSIFICATION ── */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Sparkles size={11} style={{ color: '#6b7280' }} />
            AI Classification
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={jiraCard}>
              <div style={{ padding: '12px 14px' }}>
                {AI_CLASSES.map(({ label, pct, primary }) => (
                  <div key={label} style={{ marginBottom: primary ? 14 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                      <span style={{
                        fontSize: 12, fontWeight: primary ? 600 : 400,
                        color: primary ? '#111827' : '#6b7280',
                        fontFamily: 'inherit',
                      }}>
                        {label}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: primary ? 700 : 400,
                        color: primary ? '#111827' : '#6b7280',
                      }}>
                        {pct}% Confidence
                      </span>
                    </div>
                    <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: primary ? '#1f2937' : '#d1d5db',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                ))}
                <div style={{
                  paddingTop: 10, marginTop: 10,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.4 }}>
                    ⓘ Classified by watsonx.ai L3 model
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKET METADATA ── */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Ticket Metadata</div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MetaRow label="Department" value={ticket.department?.name ?? ticket.departmentName ?? '—'} />
            <MetaRow label="Assigned Agent" value={
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 1 }}>
                {ticket.assignee ? (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#374151',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#d1d5db', flexShrink: 0,
                  }}>
                    {ticket.assignee.name?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                ) : null}
                <span style={{ fontSize: 13, color: '#111827', fontWeight: 400 }}>
                  {ticket.assignee?.name ?? 'Unassigned'}
                </span>
              </div>
            } />
            <MetaRow label="Date Created" value={fmtDate(ticket.createdAt)} />
            <MetaRow label="Reporter"     value={`${ticket.creator?.name ?? 'Unknown'} (ID: ${ticket.creator?.id ?? '—'})`} />
          </div>
        </section>

        {/* ── ATTACHMENTS ── */}
        <section style={sectionStyle}>
          <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
            <span>Attachments ({attachments.length})</span>
            <button style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <Plus size={13} />
            </button>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.length === 0 ? (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>No attachments</span>
            ) : attachments.map((a) => (
              <div key={a.id} style={{
                ...jiraCard,
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', cursor: 'pointer',
              }}>
                <AttachIcon fileName={a.fileName} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#111827',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {a.fileName}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {a.fileSize ? `${(a.fileSize / 1024).toFixed(0)} KB` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT ACTIVITY ── */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Recent Activity</div>
          <div style={{ padding: '12px 16px 16px', position: 'relative' }}>
            {/* vertical line — starts at first dot, ends at last */}
            <div style={{
              position: 'absolute',
              left: 19, top: 18, bottom: 18,
              width: 1, background: '#e5e7eb',
            }} />
            {[
              { color: '#3b82f6', text: 'Ticket opened by John Doe',  time: 'Today at 10:42 AM' },
              { color: '#6b7280', text: 'Agent Alpha assigned',        time: 'Today at 10:43 AM' },
              { color: '#f59e0b', text: 'Status: Pending Employee',   time: 'Today at 10:45 AM' },
            ].map((ev, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start',
                gap: 10, paddingBottom: 14, position: 'relative',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: ev.color, flexShrink: 0,
                  marginTop: 3, position: 'relative', zIndex: 1,
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', lineHeight: '16px' }}>
                    {ev.text}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {ev.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TAGS ── */}
        <section style={{ ...sectionStyle, borderBottom: 'none' }}>
          <div style={sectionHeaderStyle}>Tags</div>
          <div style={{ padding: '10px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(ticket.tags ?? []).map((tag) => (
              <span key={tag} style={{
                padding: '3px 8px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                fontSize: 10, fontWeight: 600, color: '#374151',
                letterSpacing: '0.04em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */
function MetaRow({ label, value }) {
  return (
    <div>
      {/* Label: 10px, 600 weight, all-caps, tracked, gray — matches design */}
      <div style={{
        fontSize: 10, fontWeight: 600,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: '#6b7280', marginBottom: 4,
      }}>
        {label}
      </div>
      {/* Value: 13px, regular weight, near-black */}
      <div style={{ fontSize: 13, fontWeight: 400, color: '#111827', lineHeight: '18px' }}>
        {value}
      </div>
    </div>
  );
}

const sectionStyle = { borderBottom: '1px solid #e5e7eb' };
const sectionHeaderStyle = {
  padding: '10px 16px',
  fontSize: 10, fontWeight: 700,
  letterSpacing: '0.09em', textTransform: 'uppercase',
  color: '#374151', background: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex', alignItems: 'center', gap: 6,
};
const jiraCard = { border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', background: '#ffffff' };

/* ── TicketHeader ─────────────────────────────────────────────────────────── */
function TicketHeader({ ticket }) {
  const sla = useSlaRemaining(ticket.createdAt, ticket.dueAt);

  /* Derive SLA window label from createdAt→dueAt span */
  const slaWindowLabel = useMemo(() => {
    if (!ticket.createdAt || !ticket.dueAt) return null;
    const ms = new Date(ticket.dueAt).getTime() - new Date(ticket.createdAt).getTime();
    const h  = Math.round(ms / 3600000);
    return `Resolution SLA (Standard ${h}h)`;
  }, [ticket.createdAt, ticket.dueAt]);

  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', background: '#ffffff', flexShrink: 0 }}>

      {/* ID / Title / Badges row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <h2 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 28, fontWeight: 900, color: '#0b1c30',
            lineHeight: '32px', flexShrink: 0, margin: 0,
          }}>
            #TK-{ticket.id}
          </h2>
          <span style={{ fontSize: 24, fontWeight: 300, color: '#c4c7c9', flexShrink: 0, lineHeight: '32px' }}>/</span>
          <h2 style={{
            fontSize: 22, fontWeight: 900, color: '#0b1c30',
            lineHeight: '28px', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {ticket.title}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0, paddingTop: 4 }}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* SLA label row + progress bar — always visible */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {slaWindowLabel ?? 'Resolution SLA'}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: sla ? sla.color : '#9ca3af' }}>
            {sla ? sla.label : 'No SLA set'}
          </span>
        </div>
        {ticket.dueAt ? (
          <SlaProgressBar ticket={ticket} darkTrack />
        ) : (
          /* Empty track when no dueAt */
          <div style={{ width: '100%', height: 5, background: '#e5e7eb', borderRadius: 0 }} />
        )}
      </div>
    </div>
  );
}

