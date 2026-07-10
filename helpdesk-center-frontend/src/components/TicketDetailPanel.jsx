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
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTicket, useUpdateStatus } from '../hooks/useTickets';
import { getAttachments, uploadAttachment, fetchAttachmentBlob, downloadUrl } from '../api/attachmentsApi';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CommentSection from './CommentSection';
import SlaProgressBar from './SlaProgressBar';
import { FileText, ImageIcon, Plus, Sparkles, X, Download, Loader } from 'lucide-react';

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

/* ── Attachment viewer lightbox ───────────────────────────────────────────── */
function AttachmentViewer({ attachment, onClose }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const isImage = attachment?.fileType?.startsWith('image/');
  const isPdf   = attachment?.fileType === 'application/pdf';

  useEffect(() => {
    if (!attachment) return;
    setLoading(true);
    setError(false);
    setObjectUrl(null);

    const disposition = isImage ? 'view' : 'download';
    fetchAttachmentBlob(attachment.id, disposition)
      .then(r => {
        const url = URL.createObjectURL(r.data);
        setObjectUrl(url);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => {
      // revoked in the above closure when new attachment is selected
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment?.id]);

  // revoke object URL on unmount
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!attachment) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Modal panel — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          maxWidth: '90vw', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8f9ff',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0b1c30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>
            {attachment.fileName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a
              href={objectUrl ?? downloadUrl(attachment.id)}
              download={attachment.fileName}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, color: '#3b82d4',
                textDecoration: 'none', padding: '4px 8px',
                border: '1px solid #dbeafe', background: '#eff6ff',
              }}
              title="Download"
            >
              <Download size={12} /> Download
            </a>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 4 }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{
          flex: 1, overflow: 'auto', minHeight: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, background: '#f1f5f9',
        }}>
          {loading && (
            <span style={{ fontSize: 13, color: '#76777d' }}>Loading…</span>
          )}
          {!loading && error && (
            <span style={{ fontSize: 13, color: '#dc2626' }}>Failed to load attachment.</span>
          )}
          {!loading && !error && isImage && objectUrl && (
            <img
              src={objectUrl}
              alt={attachment.fileName}
              style={{ maxWidth: '80vw', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
            />
          )}
          {!loading && !error && isPdf && objectUrl && (
            <iframe
              src={objectUrl}
              title={attachment.fileName}
              style={{ width: '75vw', height: '72vh', border: 'none' }}
            />
          )}
          {!loading && !error && !isImage && !isPdf && objectUrl && (
            <div style={{ textAlign: 'center' }}>
              <FileText size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: '#45464d', marginBottom: 16 }}>
                Preview not available for this file type.
              </p>
              <a
                href={objectUrl}
                download={attachment.fileName}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#ffffff',
                  background: '#0b1c30', padding: '8px 18px',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <Download size={13} /> Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPanel({ ticketId }) {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const updateStatus = useUpdateStatus();
  const [attachments, setAttachments]           = useState([]);
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const [uploading, setUploading]               = useState(false);
  const [uploadErr, setUploadErr]               = useState(null);
  const [dragOver, setDragOver]                 = useState(false);
  const fileInputRef = useRef(null);

  const handleCloseViewer = useCallback(() => setViewingAttachment(null), []);

  const refreshAttachments = useCallback(() => {
    if (!ticketId) return;
    getAttachments(ticketId).then(r => setAttachments(r.data ?? [])).catch(() => {});
  }, [ticketId]);

  useEffect(() => { refreshAttachments(); }, [refreshAttachments]);

  const handleUploadFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    setUploadErr(null);
    try {
      for (const file of files) {
        await uploadAttachment(ticketId, file);
      }
      refreshAttachments();
    } catch {
      setUploadErr('Upload failed — please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [ticketId, refreshAttachments]);

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

        {/* ── Conversation (fills remaining height; CommentSection handles its own scroll) */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f8f9ff' }}>
          <CommentSection ticketId={ticketId} ticket={ticket} onAttachFile={handleUploadFiles} />
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
          {/* Hidden file input — triggered by Plus button or Paperclip */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleUploadFiles(e.target.files)}
          />

          <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
            <span>Attachments ({attachments.length})</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload attachment"
              style={{ background: 'transparent', border: 'none', color: uploading ? '#94a3b8' : '#6b7280', cursor: uploading ? 'default' : 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              disabled={uploading}
            >
              {uploading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
            </button>
          </div>

          {/* Drop zone — visible when dragging over */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUploadFiles(e.dataTransfer.files); }}
            style={{
              margin: dragOver ? '8px 16px' : '0 16px',
              border: `1.5px dashed ${dragOver ? '#3b82f6' : 'transparent'}`,
              borderRadius: 6,
              background: dragOver ? '#eff6ff' : 'transparent',
              padding: dragOver ? '10px 0' : 0,
              textAlign: 'center',
              fontSize: 11,
              color: '#3b82f6',
              transition: 'all 150ms',
              overflow: 'hidden',
              maxHeight: dragOver ? 48 : 0,
            }}
          >
            Drop files here to upload
          </div>

          {uploadErr && (
            <div style={{ margin: '4px 16px 0', fontSize: 11, color: '#dc2626' }}>{uploadErr}</div>
          )}

          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.length === 0 && !uploading ? (
              <span
                style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload"
              >
                No attachments — click to add
              </span>
            ) : attachments.map((a) => (
              <div
                key={a.id}
                onClick={() => setViewingAttachment(a)}
                style={{
                  ...jiraCard,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', cursor: 'pointer',
                }}
                title={`View ${a.fileName}`}
              >
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
          {uploading && (
            <div style={{ padding: '0 16px 10px', fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader size={11} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              Uploading…
            </div>
          )}
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

      {/* ── Attachment lightbox (portal-style, rendered at root of panel) ── */}
      {viewingAttachment && (
        <AttachmentViewer attachment={viewingAttachment} onClose={handleCloseViewer} />
      )}
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
    <div style={{ padding: '12px 20px 10px', borderBottom: '1px solid #e5e7eb', background: '#ffffff', flexShrink: 0 }}>

      {/* ID / Title / Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <h2 style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 20, fontWeight: 900, color: '#0b1c30',
            lineHeight: '24px', flexShrink: 0, margin: 0,
          }}>
            #TK-{ticket.id}
          </h2>
          <span style={{ fontSize: 18, fontWeight: 300, color: '#c4c7c9', flexShrink: 0, lineHeight: '24px' }}>/</span>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#0b1c30',
            lineHeight: '22px', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {ticket.title}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* SLA label row + progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#45464d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {slaWindowLabel ?? 'Resolution SLA'}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: sla ? sla.color : '#9ca3af' }}>
            {sla ? sla.label : 'No SLA set'}
          </span>
        </div>
        {ticket.dueAt ? (
          <SlaProgressBar ticket={ticket} darkTrack />
        ) : (
          <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 0 }} />
        )}
      </div>
    </div>
  );
}

