import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { T } from '../styles/tokens';
import { getTicket, updateStatus } from '../api/ticketsApi';
import { getAttachments, downloadUrl } from '../api/attachmentsApi';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import CommentSection from './CommentSection';
import {
  ChevronDown, FileText, ImageIcon, File, Download, X, Maximize2, Minimize2
} from 'lucide-react';

const STATUSES      = ['open', 'in_progress', 'resolved'];
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

/* ── File type icon ──────────────────────────────────────────────────────── */
function FileTypeIcon({ type }) {
  const base = { width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  if (type === 'pdf')   return <div style={{ ...base, background: '#dc2626' }}><FileText size={14} color="#fff" /></div>;
  if (type === 'image') return <div style={{ ...base, background: T.navy }}><ImageIcon size={14} color="#fff" /></div>;
  if (type === 'text')  return <div style={{ ...base, background: T.textSecondary }}><FileText size={14} color="#fff" /></div>;
  return                       <div style={{ ...base, background: T.textMuted }}><File     size={14} color="#fff" /></div>;
}

/* ── File viewer modal ───────────────────────────────────────────────────── */
function FileViewer({ attachment, onClose }) {
  const ext  = attachment.fileName?.split('.').pop()?.toLowerCase();
  const type = ext === 'pdf' ? 'pdf' : ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : ext === 'txt' ? 'text' : 'other';
  const url  = downloadUrl(attachment.id);

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 10, display: 'flex', flexDirection: 'column',
        maxWidth: 900, width: '100%', maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 16 }}>
            {attachment.fileName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a
              href={url}
              download={attachment.fileName}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#fff',
                background: T.navy, border: 'none', borderRadius: T.radiusMd,
                padding: '6px 14px', textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <Download size={13} />
              Download
            </a>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, border: `1px solid ${T.border}`, borderRadius: T.radiusMd,
                background: '#fff', cursor: 'pointer', color: T.textSecondary,
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa', minHeight: 200 }}>
          {type === 'image' && (
            <img src={url} alt={attachment.fileName} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }} />
          )}
          {type === 'pdf' && (
            <iframe src={url} title={attachment.fileName} style={{ width: '100%', height: '75vh', border: 'none' }} />
          )}
          {(type === 'text' || type === 'other') && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <File size={48} color={T.textMuted} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: T.textSecondary, marginBottom: 16 }}>Preview not available for this file type.</p>
              <a
                href={url}
                download={attachment.fileName}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  background: T.navy, borderRadius: T.radiusMd, padding: '8px 20px',
                  textDecoration: 'none',
                }}
              >
                <Download size={14} />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── TicketDetailPanel ───────────────────────────────────────────────────── */
/**
 * Props:
 *   ticketId   — string/number, required
 *   onClose    — optional () => void  — renders a ✕ button in the header
 *   onMaximize — optional () => void  — renders a ⛶ Maximize button
 *   onMinimize — optional () => void  — renders a ⤢ Minimize button
 */
export default function TicketDetailPanel({ ticketId, onClose, onMaximize, onMinimize }) {
  const { user } = useAuth();
  const [ticket,        setTicket]        = useState(null);
  const [attachments,   setAttachments]   = useState([]);
  const [updating,      setUpdating]      = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [error,         setError]         = useState('');
  const [viewingFile,   setViewingFile]   = useState(null);

  const isAgent = user?.role !== 'employee';

  useEffect(() => {
    setTicket(null);
    setError('');
    setAttachments([]);
    getTicket(ticketId)
      .then(r => { setTicket(r.data); setPendingStatus(r.data.status); })
      .catch(err => setError('Could not load ticket. ' + (err?.response?.data?.error || '')));
    getAttachments(ticketId).then(r => setAttachments(r.data)).catch(() => {});
  }, [ticketId]);

  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      const res = await updateStatus(ticketId, pendingStatus);
      setTicket(res.data);
      setPendingStatus(res.data.status);
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  /* Loading / error states */
  if (error) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#b91c1c', fontSize: 14 }}>{error}</div>
  );
  if (!ticket) return (
    <div style={{ padding: 32, textAlign: 'center', color: T.textSecondary, fontSize: 14 }}>Loading…</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header card */}
      <div style={cardSt}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {/* Title + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{ticket.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: T.textMuted, fontFamily: 'monospace' }}>#{ticket.id}</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>{fmtDate(ticket.createdAt)}</span>
              <CategoryBadge value={ticket.category} />
              <StatusBadge value={ticket.status} />
              <PriorityBadge value={ticket.priority} />
            </div>
          </div>

          {/* Panel action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {onMaximize && (
              <button
                onClick={onMaximize}
                title="Maximize"
                style={iconBtnSt}
              >
                <Maximize2 size={15} />
              </button>
            )}
            {onMinimize && (
              <button
                onClick={onMinimize}
                title="Minimize"
                style={iconBtnSt}
              >
                <Minimize2 size={15} />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                title="Close panel"
                style={iconBtnSt}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Agent status control — below title row */}
        {isAgent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={pendingStatus}
                onChange={e => setPendingStatus(e.target.value)}
                disabled={updating}
                style={{ height: 34, paddingLeft: 10, paddingRight: 30, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', outline: 'none', cursor: 'pointer' }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <ChevronDown size={11} color={T.textMuted} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            <button
              onClick={handleSaveStatus}
              disabled={updating || pendingStatus === ticket.status}
              style={{
                height: 34, padding: '0 14px',
                background: (updating || pendingStatus === ticket.status) ? T.accentMid : T.navy,
                color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13,
                cursor: (updating || pendingStatus === ticket.status) ? 'not-allowed' : 'pointer',
              }}
            >
              {updating ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Description + Metadata card */}
      <div style={cardSt}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '0 28px' }} className="ticket-detail-grid">
          <div>
            <h3 style={sectionHeadSt}>Description</h3>
            <p style={{ fontSize: 14, color: T.textPrimary, lineHeight: 1.75 }}>{ticket.description}</p>
          </div>
          <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 14 }} className="ticket-detail-meta">
            <div>
              <p style={metaLabelSt}>Submitted By</p>
              <p style={metaValueSt}>{ticket.createdBy?.username ?? '—'}</p>
              <p style={metaSubSt}>{ticket.email}</p>
            </div>
            <div>
              <p style={metaLabelSt}>Assigned Agent</p>
              <p style={metaValueSt}>{ticket.assignedTo?.username ?? 'Unassigned'}</p>
            </div>
            <div>
              <p style={metaLabelSt}>Created</p>
              <p style={{ fontSize: 13, color: T.textSecondary }}>{fmtDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p style={metaLabelSt}>Last Updated</p>
              <p style={{ fontSize: 13, color: T.textSecondary }}>{fmtDate(ticket.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments card */}
      <div style={cardSt}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>Attachments</h3>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.textSecondary, background: T.surface, border: `1px solid ${T.border}`, padding: '2px 8px', borderRadius: T.radiusPill }}>
            {attachments.length}
          </span>
        </div>
        {attachments.length === 0 ? (
          <p style={{ fontSize: 13, color: T.textMuted }}>No attachments.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {attachments.map(a => {
              const ext  = a.fileName?.split('.').pop()?.toLowerCase();
              const type = ext === 'pdf' ? 'pdf' : ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : ext === 'txt' ? 'text' : 'other';
              return (
                <div
                  key={a.id}
                  onClick={() => setViewingFile(a)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <FileTypeIcon type={type} />
                  <span
                    style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.textDecorationColor = T.accent}
                    onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                  >{a.fileName}</span>
                  <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>{(a.fileSize / 1024).toFixed(1)} KB</span>
                  <span style={{ fontSize: 12, color: T.textSecondary, flexShrink: 0 }}>Click to view</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments */}
      <CommentSection ticketId={ticketId} />

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer attachment={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      {/* Responsive: collapse description/meta grid on narrow panels */}
      <style>{`
        @media (max-width: 640px) {
          .ticket-detail-grid { grid-template-columns: 1fr !important; }
          .ticket-detail-meta { border-left: none !important; padding-left: 0 !important; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; }
        }
      `}</style>
    </div>
  );
}

const cardSt        = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const sectionHeadSt = { fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 10 };
const metaLabelSt   = { fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };
const metaValueSt   = { fontSize: 13, fontWeight: 500, color: T.textPrimary };
const metaSubSt     = { fontSize: 12, color: T.textSecondary };
const iconBtnSt     = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: T.radiusMd,
  background: '#fff', cursor: 'pointer', color: T.textSecondary,
};
