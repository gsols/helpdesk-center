import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTicket, updateStatus } from '../api/ticketsApi';
import { getAttachments, downloadUrl } from '../api/attachmentsApi';
import AppHeader from '../components/AppHeader';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import CategoryBadge from '../components/CategoryBadge';
import CommentSection from '../components/CommentSection';
import {
  ArrowLeft, ChevronDown, FileText, ImageIcon, File, Download, X
} from 'lucide-react';

const STATUSES = ['open', 'in_progress', 'resolved'];
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

function FileTypeIcon({ type }) {
  const base = { width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  if (type === 'pdf')   return <div style={{ ...base, background: '#dc2626' }}><FileText size={14} color="#fff" /></div>;
  if (type === 'image') return <div style={{ ...base, background: '#3b82d4' }}><ImageIcon size={14} color="#fff" /></div>;
  if (type === 'text')  return <div style={{ ...base, background: '#57606a' }}><FileText size={14} color="#fff" /></div>;
  return                       <div style={{ ...base, background: '#9ca3af' }}><File     size={14} color="#fff" /></div>;
}

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
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2328', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 16 }}>
            {attachment.fileName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a
              href={url}
              download={attachment.fileName}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#fff',
                background: '#3b82d4', border: 'none', borderRadius: 6,
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
                width: 32, height: 32, border: '1px solid #e5e7eb', borderRadius: 6,
                background: '#fff', cursor: 'pointer', color: '#57606a',
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa', minHeight: 200 }}>
          {type === 'image' && (
            <img
              src={url}
              alt={attachment.fileName}
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
            />
          )}
          {type === 'pdf' && (
            <iframe
              src={url}
              title={attachment.fileName}
              style={{ width: '100%', height: '75vh', border: 'none' }}
            />
          )}
          {(type === 'text' || type === 'other') && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <File size={48} color="#9ca3af" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: '#57606a', marginBottom: 16 }}>
                Preview not available for this file type.
              </p>
              <a
                href={url}
                download={attachment.fileName}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  background: '#3b82d4', borderRadius: 6, padding: '8px 20px',
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

export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket,      setTicket]      = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [updating,    setUpdating]    = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [error,       setError]       = useState('');
  const [viewingFile, setViewingFile] = useState(null);

  const isAgent = user?.role !== 'employee';

  useEffect(() => {
    getTicket(id)
      .then(r => { setTicket(r.data); setPendingStatus(r.data.status); })
      .catch(err => setError('Could not load ticket. ' + (err?.response?.data?.error || '')));
    getAttachments(id).then(r => setAttachments(r.data)).catch(() => {});
  }, [id]);

  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      const res = await updateStatus(id, pendingStatus);
      setTicket(res.data);
      setPendingStatus(res.data.status);
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

  if (error)   return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <AppHeader user={user} onLogout={() => {}} />
      <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error}</div>
    </div>
  );
  if (!ticket) return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <AppHeader user={user} onLogout={() => {}} />
      <div style={{ padding: 40, textAlign: 'center', color: '#57606a' }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <AppHeader user={user} onLogout={() => navigate('/login')} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82d4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        {/* Header card */}
        <div style={cardSt}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2328', marginBottom: 10 }}>{ticket.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>#{ticket.id}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{fmtDate(ticket.createdAt)}</span>
                <CategoryBadge value={ticket.category} />
                <StatusBadge value={ticket.status} />
                <PriorityBadge value={ticket.priority} />
              </div>
            </div>
            {isAgent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={pendingStatus}
                    onChange={e => setPendingStatus(e.target.value)}
                    disabled={updating}
                    style={{ height: 36, paddingLeft: 12, paddingRight: 32, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', appearance: 'none', outline: 'none', cursor: 'pointer' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <ChevronDown size={12} color="#9ca3af" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <button
                  onClick={handleSaveStatus}
                  disabled={updating || pendingStatus === ticket.status}
                  style={{ height: 36, padding: '0 16px', background: (updating || pendingStatus === ticket.status) ? '#93c5fd' : '#3b82d4', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: (updating || pendingStatus === ticket.status) ? 'not-allowed' : 'pointer' }}
                >
                  {updating ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details card — responsive two-column */}
        <div style={cardSt}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '0 32px' }} className="ticket-detail-grid">
            {/* Description */}
            <div>
              <h3 style={sectionHeadSt}>Description</h3>
              <p style={{ fontSize: 14, color: '#1f2328', lineHeight: 1.75 }}>{ticket.description}</p>
            </div>
            {/* Metadata */}
            <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 16 }} className="ticket-detail-meta">
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
                <p style={{ fontSize: 13, color: '#57606a' }}>{fmtDate(ticket.createdAt)}</p>
              </div>
              <div>
                <p style={metaLabelSt}>Last Updated</p>
                <p style={{ fontSize: 13, color: '#57606a' }}>{fmtDate(ticket.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments card */}
        <div style={cardSt}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1f2328' }}>Attachments</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#57606a', background: '#f3f4f6', padding: '2px 8px', borderRadius: 999 }}>
              {attachments.length}
            </span>
          </div>
          {attachments.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>No attachments.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {attachments.map(a => {
                const ext = a.fileName?.split('.').pop()?.toLowerCase();
                const type = ext === 'pdf' ? 'pdf' : ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : ext === 'txt' ? 'text' : 'other';
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                    onClick={() => setViewingFile(a)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <FileTypeIcon type={type} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#3b82d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.textDecorationColor = '#3b82d4'}
                      onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                    >{a.fileName}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{(a.fileSize / 1024).toFixed(1)} KB</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#57606a', flexShrink: 0 }}>
                      Click to view
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comments */}
        <CommentSection ticketId={id} />
      </main>

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer attachment={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      {/* Responsive style for detail grid */}
      <style>{`
        @media (max-width: 640px) {
          .ticket-detail-grid { grid-template-columns: 1fr !important; }
          .ticket-detail-meta { border-left: none !important; padding-left: 0 !important; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px; }
        }
      `}</style>
    </div>
  );
}

const cardSt       = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)' };
const sectionHeadSt = { fontSize: 13, fontWeight: 600, color: '#1f2328', marginBottom: 10 };
const metaLabelSt  = { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };
const metaValueSt  = { fontSize: 13, fontWeight: 500, color: '#1f2328' };
const metaSubSt    = { fontSize: 12, color: '#57606a' };
