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
import { useTicket, useUpdateStatus, useAiLog } from '../hooks/useTickets';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { getAttachments, uploadAttachment, fetchAttachmentBlob, downloadUrl } from '../api/attachmentsApi';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CommentSection from './CommentSection';
import SlaProgressBar from './SlaProgressBar';
import RerouteModal from './RerouteModal';
import { FileText, ImageIcon, Plus, Sparkles, X, Download, Loader, ArrowLeftRight, CheckCircle, ChevronRight } from 'lucide-react';

/* ── SLA remaining time helper — full 5-state engine ─────────────────────── */
function useSlaRemaining(createdAt, dueAt, status) {
  return useMemo(() => {
    const STATUS = status?.toUpperCase();
    const isClosed  = STATUS === 'RESOLVED' || STATUS === 'CLOSED';
    const isPending = STATUS === 'PENDING_EMPLOYEE';

    if (!createdAt || !dueAt) return { state: 'NO_SLA', label: 'No SLA set', color: '#9ca3af' };

    const now     = Date.now();
    const created = new Date(createdAt).getTime();
    const due     = new Date(dueAt).getTime();
    const total   = due - created;
    const ms      = Math.max(0, due - now);

    if (!isClosed && due < now)
      return { state: 'BREACHED', label: '⚠️ SLA BREACHED / EXPIRED', color: '#dc2626' };
    if (isPending) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const timeStr = h > 0 ? `${h}H ${m}M` : `${m}M`;
      return { state: 'PAUSED', label: `${timeStr} (PAUSED)`, color: '#b45309' };
    }

    const remainingPct = total > 0 ? (ms / total) * 100 : 0;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const label = h > 0 ? `${h}H ${m}M REMAINING` : `${m}M REMAINING`;

    if (remainingPct < 25) return { state: 'ALERT',   label, color: '#dc2626' };
    if (remainingPct < 50) return { state: 'WARNING',  label, color: '#d97706' };
    return { state: 'SAFE', label, color: '#45464d' };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdAt, dueAt, status]);
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

/* ── build a chronological activity feed from real data ──────────────────── */
function useActivityFeed(ticket, messages) {
  return useMemo(() => {
    const events = [];
    const fmt = (d) => d
      ? new Date(d).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        })
      : '—';

    // 1. Ticket opened
    if (ticket?.createdAt) {
      events.push({
        key:   'opened',
        color: '#3b82f6',
        text:  `Ticket opened by ${ticket.creator?.name ?? 'Unknown'}`,
        time:  fmt(ticket.createdAt),
        ts:    new Date(ticket.createdAt).getTime(),
      });
    }

    // 2. Agent assigned (only when assignee is present)
    if (ticket?.assignee) {
      // Use updatedAt as best approximation; offset +1 ms so it sorts after "opened"
      const ts = new Date(ticket.updatedAt ?? ticket.createdAt).getTime() + 1;
      events.push({
        key:   'assigned',
        color: '#8b5cf6',
        text:  `${ticket.assignee.name} assigned`,
        time:  fmt(ticket.updatedAt ?? ticket.createdAt),
        ts,
      });
    }

    // 3. Every real message from the thread
    (messages ?? []).forEach((m) => {
      const isAgent = m.sender?.role && m.sender.role !== 'EMPLOYEE';
      events.push({
        key:   `msg-${m.id}`,
        color: isAgent ? '#6b7280' : '#0ea5e9',
        text:  `${m.sender?.name ?? 'Unknown'} replied`,
        time:  fmt(m.createdAt),
        ts:    new Date(m.createdAt).getTime(),
      });
    });

    // 4. Current status — only interesting if not the default OPEN
    const st = ticket?.status?.toUpperCase();
    if (st && st !== 'OPEN' && ticket?.updatedAt) {
      const statusLabels = {
        IN_PROGRESS:      'Status changed to In Progress',
        PENDING_EMPLOYEE: 'Status changed to Pending Employee',
        RESOLVED:         'Ticket resolved',
        CLOSED:           'Ticket closed',
      };
      const color = st === 'RESOLVED' || st === 'CLOSED'
        ? '#10b981'
        : st === 'PENDING_EMPLOYEE'
          ? '#f59e0b'
          : '#6b7280';
      // Use updatedAt + 2 ms offset so it always sorts last among same-timestamp events
      events.push({
        key:   `status-${st}`,
        color,
        text:  statusLabels[st] ?? `Status: ${st}`,
        time:  fmt(ticket.updatedAt),
        ts:    new Date(ticket.updatedAt).getTime() + 2,
      });
    }

    events.sort((a, b) => a.ts - b.ts);
    return events;
  }, [ticket, messages]);
}

export default function TicketDetailPanel({ ticketId }) {
  const { user }                    = useAuth();
  const { data: ticket, isLoading } = useTicket(ticketId);
  const { data: messages = [] }     = useMessages(ticketId);
  const { data: aiLog }             = useAiLog(ticketId);
  const updateStatus = useUpdateStatus();
  const [attachments, setAttachments]           = useState([]);
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const [uploading, setUploading]               = useState(false);
  const [uploadErr, setUploadErr]               = useState(null);
  const [dragOver, setDragOver]                 = useState(false);
  const [rerouteOpen, setRerouteOpen]           = useState(false);
  const fileInputRef = useRef(null);

  const isAgent    = user?.role === 'agent';
  const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket?.status?.toUpperCase());

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

        {/* ── PRIMARY ACTIONS — agent only ── */}
        {isAgent && (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>Primary Actions</div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setRerouteOpen(true)}
                style={actionOutlineBtn}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowLeftRight size={14} />
                  <span>Re-Route Ticket</span>
                </div>
                <ChevronRight size={13} color="#9ca3af" />
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: ticket.id, status: 'RESOLVED' })}
                disabled={isResolved || updateStatus.isPending}
                style={{
                  ...actionSolidBtn,
                  opacity: isResolved || updateStatus.isPending ? 0.5 : 1,
                  cursor:  isResolved || updateStatus.isPending ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!isResolved && !updateStatus.isPending) e.currentTarget.style.background = '#1e293b'; }}
                onMouseLeave={(e) => { if (!isResolved && !updateStatus.isPending) e.currentTarget.style.background = '#0f172a'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={14} />
                  <span>{isResolved ? 'Resolved' : updateStatus.isPending ? 'Saving…' : 'Mark Resolved'}</span>
                </div>
                <CheckCircle size={13} color="rgba(255,255,255,0.35)" />
              </button>
            </div>
          </section>
        )}

        {/* ── AI CLASSIFICATION ── */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <Sparkles size={11} style={{ color: '#6b7280' }} />
            AI Classification
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={jiraCard}>
              <div style={{ padding: '12px 14px' }}>
                {!aiLog ? (
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>No classification data</span>
                ) : (() => {
                  const pct    = aiLog.confidenceScore != null ? Math.round(Number(aiLog.confidenceScore)) : null;
                  const deptName = aiLog.predictedDepartment?.name ?? '—';
                  const misclassified = aiLog.isMisclassified;
                  const actualName    = aiLog.actualDepartment?.name;
                  return (
                    <>
                      {/* Primary row */}
                      <div style={{ marginBottom: pct != null ? 14 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', fontFamily: 'inherit' }}>
                            {deptName}
                          </span>
                          {pct != null && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
                              {pct}% Confidence
                            </span>
                          )}
                        </div>
                        {pct != null && (
                          <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#1f2937', borderRadius: 2 }} />
                          </div>
                        )}
                      </div>
                      {/* Misclassification notice */}
                      {misclassified && actualName && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>
                              Corrected → {actualName}
                            </span>
                          </div>
                        </div>
                      )}
                      <div style={{ paddingTop: 10, marginTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.4 }}>
                          ⓘ Classified by watsonx.ai L3 model
                        </span>
                      </div>
                    </>
                  );
                })()}
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
            <MetaRow label="Reporter"     value={ticket.creator?.name ?? 'Unknown'} />
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
        <RecentActivity ticket={ticket} messages={messages} />

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

      {/* ── Reroute modal — agent only ── */}
      {rerouteOpen && ticket && (
        <RerouteModal ticket={ticket} onClose={() => setRerouteOpen(false)} />
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

/* RecentActivity — renders the wired timeline section */
function RecentActivity({ ticket, messages }) {
  const events = useActivityFeed(ticket, messages);
  return (
    <section style={sectionStyle}>
      <div style={sectionHeaderStyle}>Recent Activity</div>
      <div style={{ padding: '12px 16px 16px', position: 'relative' }}>
        {/* vertical connector line */}
        {events.length > 1 && (
          <div style={{
            position: 'absolute',
            left: 19, top: 18, bottom: 18,
            width: 1, background: '#e5e7eb',
          }} />
        )}
        {events.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af', padding: '4px 0' }}>No activity yet.</div>
        ) : events.map((ev) => (
          <div key={ev.key} style={{
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
  );
}

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

const actionOutlineBtn = {
  width: '100%', height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px',
  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer',
  transition: 'background 150ms',
};

const actionSolidBtn = {
  width: '100%', height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px',
  background: '#0f172a', border: 'none', borderRadius: 6,
  fontSize: 13, fontWeight: 700, color: '#ffffff',
  transition: 'background 150ms',
};

/* ── TicketHeader ─────────────────────────────────────────────────────────── */
function TicketHeader({ ticket }) {
  const sla = useSlaRemaining(ticket.createdAt, ticket.dueAt, ticket.status);

  const isBreached = sla?.state === 'BREACHED';
  const isPaused   = sla?.state === 'PAUSED';
  const isAlert    = sla?.state === 'ALERT';

  /* Derive SLA window label from createdAt→dueAt span */
  const slaWindowLabel = useMemo(() => {
    if (!ticket.createdAt || !ticket.dueAt) return 'Resolution SLA';
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
          {/* Left: section title — swaps to breach flag when BREACHED */}
          {isBreached ? (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ⚠️ SLA BREACHED / EXPIRED
            </span>
          ) : (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#45464d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {slaWindowLabel}
            </span>
          )}
          {/* Right: remaining time label — pulses on ALERT */}
          <span
            className={isAlert ? 'animate-pulse' : ''}
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: sla.color }}
          >
            {sla.label}
          </span>
        </div>

        {/* Bar — always delegated to SlaProgressBar (handles NO_SLA placeholder too) */}
        <SlaProgressBar ticket={ticket} darkTrack />

        {/* PAUSED caption */}
        {isPaused && (
          <p style={{ margin: '4px 0 0', fontSize: 9, fontStyle: 'italic', color: '#b45309' }}>
            SLA Clock Paused (Awaiting Employee response)
          </p>
        )}
      </div>
    </div>
  );
}

