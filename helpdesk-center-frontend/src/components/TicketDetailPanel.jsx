/**
 * TicketDetailPanel — "employee_ticket_detail_refined_layout" wireframe
 *
 * Layout: 2-column view (fills TicketDetailPage's content area)
 *  Center (fluid):
 *    • Ticket header: large #ID / Title + status/priority badges + SLA bar
 *    • Scrollable conversation thread (CommentSection)
 *  Right (280px):
 *    • AI Classification
 *    • Ticket Metadata
 *    • Attachments
 *    • Recent Activity (timeline)
 *    • Tags
 */
import { useState, useEffect } from 'react';
import { useTicket, useUpdateStatus } from '../hooks/useTickets';
import { getAttachments } from '../api/attachmentsApi';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CommentSection from './CommentSection';
import SlaProgressBar from './SlaProgressBar';
import { FileText, ImageIcon, Plus, Sparkles } from 'lucide-react';

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
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', background: '#ffffff', flexShrink: 0 }}>
          {/* ID / Title / Badges row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <h2 style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28, fontWeight: 900, color: '#0b1c30',
                lineHeight: 1, flexShrink: 0, margin: 0,
              }}>
                #{ticket.id}
              </h2>
              <span style={{ fontSize: 24, fontWeight: 300, color: '#c4c7c9', flexShrink: 0 }}>/</span>
              <h2 style={{
                fontSize: 22, fontWeight: 900, color: '#0b1c30',
                lineHeight: '28px', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {ticket.title}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          {/* SLA bar */}
          {ticket.dueAt && (
            <div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Resolution SLA (Standard 4h)
                </span>
              </div>
              <SlaProgressBar ticket={ticket} />
            </div>
          )}
        </div>

        {/* ── Scrollable conversation ────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f8f9ff' }}>
          <CommentSection ticketId={ticketId} ticket={ticket} />
        </div>
      </div>

      {/* ── Right sidebar ────────────────────────────────────────────────── */}
      <div style={{
        width: 280, flexShrink: 0,
        borderLeft: '1px solid #e5e7eb',
        background: '#f8f9ff',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* AI CLASSIFICATION */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Sparkles size={12} style={{ color: '#565e74' }} />
            AI Classification
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={jiraCard}>
              {AI_CLASSES.map(({ label, pct, primary }) => (
                <div key={label} style={{ marginBottom: primary ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: primary ? '#0b1c30' : '#45464d' }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: primary ? '#0b1c30' : '#45464d' }}>{pct}% Confidence</span>
                  </div>
                  <div style={{ height: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: primary ? '#0b1c30' : '#c4c7c9' }} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 10, marginTop: 10, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#45464d' }}>ⓘ Classified by watsonx.ai L3 model</span>
              </div>
            </div>
          </div>
        </section>

        {/* TICKET METADATA */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Ticket Metadata</div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MetaRow label="Department"     value={ticket.department?.name ?? ticket.departmentName ?? '—'} />
            <MetaRow label="Assigned Agent" value={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {ticket.assignee && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                    {ticket.assignee?.name?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                )}
                <span>{ticket.assignee?.name ?? 'Unassigned'}</span>
              </div>
            } />
            <MetaRow label="Date Created" value={fmtDate(ticket.createdAt)} />
            <MetaRow label="Reporter"     value={`${ticket.reporter?.name ?? 'Unknown'} (ID: ${ticket.reporterId ?? '—'})`} />
          </div>
        </section>

        {/* ATTACHMENTS */}
        <section style={sectionStyle}>
          <div style={{ ...sectionHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Attachments ({attachments.length})</span>
            <button style={{ background: 'transparent', border: 'none', color: '#76777d', cursor: 'pointer', padding: 0 }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 16px' }}>
            {attachments.length === 0 ? (
              <span style={{ fontSize: 12, color: '#76777d' }}>No attachments</span>
            ) : attachments.map((a) => (
              <div key={a.id} style={{ ...jiraCard, display: 'flex', alignItems: 'center', gap: 10, padding: 8, marginBottom: 8, cursor: 'pointer' }}>
                <AttachIcon fileName={a.fileName} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1c30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.fileName}</div>
                  <div style={{ fontSize: 10, color: '#45464d' }}>{a.fileSize ? `${(a.fileSize / 1024).toFixed(0)} KB` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Recent Activity</div>
          <div style={{ padding: '8px 16px 12px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 22, top: 12, bottom: 12, width: 1, background: '#e5e7eb' }} />
            {[
              { color: '#3b82f6', text: 'Ticket opened by reporter', time: 'Today at 10:42 AM' },
              { color: '#94a3b8', text: 'Agent assigned',            time: 'Today at 10:43 AM' },
              { color: '#f59e0b', text: 'Status: Pending Employee',  time: 'Today at 10:45 AM' },
            ].map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', position: 'relative' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: 4, position: 'relative', zIndex: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0b1c30' }}>{ev.text}</div>
                  <div style={{ fontSize: 10, color: '#45464d' }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TAGS */}
        <section style={{ ...sectionStyle, borderBottom: 'none' }}>
          <div style={sectionHeaderStyle}>Tags</div>
          <div style={{ padding: '8px 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(ticket.tags ?? ['SAML', 'OKTA', 'SSO']).map((tag) => (
              <span key={tag} style={{ padding: '2px 8px', background: '#e5eeff', border: '1px solid #c6c6cd', fontSize: 10, fontWeight: 700, color: '#45464d' }}>
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
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#45464d', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#0b1c30' }}>{value}</div>
    </div>
  );
}

const sectionStyle   = { borderBottom: '1px solid #e5e7eb' };
const sectionHeaderStyle = {
  padding: '10px 16px', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: '#45464d', background: '#f8f9ff',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex', alignItems: 'center', gap: 6,
};
const jiraCard = { border: '1px solid #e0e3e5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', background: '#ffffff' };
