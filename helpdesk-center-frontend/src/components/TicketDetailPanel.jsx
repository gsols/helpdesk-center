import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTicket, useUpdateStatus } from '../hooks/useTickets';
import { getAttachments, downloadUrl } from '../api/attachmentsApi';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import CommentSection from './CommentSection';
import {
  ChevronDown, FileText, ImageIcon, File, Download, X, Maximize2, Minimize2, ArrowLeftRight
} from 'lucide-react';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_EMPLOYEE', 'RESOLVED', 'CLOSED'];
const STATUS_LABELS = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress',
  PENDING_EMPLOYEE: 'Pending Employee', RESOLVED: 'Resolved', CLOSED: 'Closed'
};

/* ── File type icon ──────────────────────────────────────────────────────── */
function FileTypeIcon({ type }) {
  // Structural icon containers — rounded-none (ADR-0006 §1)
  if (type === 'pdf')   return <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-red-600"><FileText size={14} color="#fff" /></div>;
  if (type === 'image') return <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-blue-700"><ImageIcon size={14} color="#fff" /></div>;
  if (type === 'text')  return <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-gray-500"><FileText size={14} color="#fff" /></div>;
  return                       <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0 bg-gray-400"><File     size={14} color="#fff" /></div>;
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
    <div onClick={handleBackdrop} className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 transition-all duration-150 ease-in-out">
      {/* Modal container — structural, rounded-none (ADR-0006 §1) */}
      <div className="bg-white rounded-none flex flex-col max-w-4xl w-full max-h-[90vh] overflow-hidden border border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 shrink-0">
          <span className="text-sm font-semibold text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-4">
            {attachment.fileName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {/* Action button — rounded per hybrid rule (ADR-0006 §2) */}
            <a href={url} download={attachment.fileName}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-700 rounded px-3.5 py-1.5 no-underline hover:bg-blue-800">
              <Download size={13} /> Download
            </a>
            <button onClick={onClose}
              className="flex items-center justify-center w-8 h-8 border border-neutral-200 rounded bg-white text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-50 min-h-48">
          {type === 'image' && <img src={url} alt={attachment.fileName} className="max-w-full max-h-[75vh] object-contain block" />}
          {type === 'pdf'   && <iframe src={url} title={attachment.fileName} className="w-full h-[75vh] border-none" />}
          {(type === 'text' || type === 'other') && (
            <div className="p-6 text-center">
              <File size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">Preview not available for this file type.</p>
              <a href={url} download={attachment.fileName}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-700 rounded px-5 py-2 no-underline hover:bg-blue-800">
                <Download size={14} /> Download File
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
 *   readOnly   — bool, when true hides agent controls (e.g. Archive tab view)
 *   onClose    — optional () => void
 *   onMaximize — optional () => void
 *   onMinimize — optional () => void
 *   onReroute  — optional (ticket) => void — called when reroute button is clicked
 */
export default function TicketDetailPanel({ ticketId, readOnly = false, onClose, onMaximize, onMinimize, onReroute }) {
  const { user } = useAuth();
  const { data: ticket, isLoading, isError } = useTicket(ticketId);
  const updateStatus = useUpdateStatus();

  const [attachments,   setAttachments]   = useState([]);
  const [pendingStatus, setPendingStatus] = useState('');
  const [viewingFile,   setViewingFile]   = useState(null);

  const isAgent = user?.role !== 'employee';
  const canEdit = isAgent && !readOnly;

  useEffect(() => {
    if (ticket) setPendingStatus(ticket.status);
  }, [ticket]);

  useEffect(() => {
    if (ticketId) getAttachments(ticketId).then(r => setAttachments(r.data)).catch(() => {});
  }, [ticketId]);

  const handleSaveStatus = async () => {
    try {
      await updateStatus.mutateAsync({ id: ticketId, status: pendingStatus });
    } catch {
      alert('Failed to update status');
    }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  if (isError) return <div className="p-8 text-center text-red-700 text-sm">Could not load ticket.</div>;
  if (isLoading || !ticket) return <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>;

  return (
    <div className="flex flex-col gap-4">

      {/* Header card */}
      {/* Header card — structural container, rounded-none (ADR-0006 §1) */}
      <div className="bg-white border border-neutral-200 rounded-none p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 mb-2">{ticket.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
              <span className="text-xs text-gray-400">{fmtDate(ticket.createdAt)}</span>
              <CategoryBadge value={ticket.department?.name} />
              <StatusBadge value={ticket.status} />
              <PriorityBadge value={ticket.priority} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && onReroute && (
              // Action buttons — rounded per hybrid rule (ADR-0006 §2)
              <button onClick={() => onReroute(ticket)}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100"
                title="Re-route to correct department">
                <ArrowLeftRight size={13} /> Re-Route
              </button>
            )}
            {onMaximize && <button onClick={onMaximize} title="Maximize" className="flex items-center justify-center w-7.5 h-7.5 border border-neutral-200 rounded bg-white text-gray-400 hover:text-gray-700"><Maximize2 size={15} /></button>}
            {onMinimize && <button onClick={onMinimize} title="Minimize" className="flex items-center justify-center w-7.5 h-7.5 border border-neutral-200 rounded bg-white text-gray-400 hover:text-gray-700"><Minimize2 size={15} /></button>}
            {onClose    && <button onClick={onClose}    title="Close"    className="flex items-center justify-center w-7.5 h-7.5 border border-neutral-200 rounded bg-white text-gray-400 hover:text-gray-700"><X        size={15} /></button>}
          </div>
        </div>

        {/* Agent status control */}
        {canEdit && (
          <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-gray-100">
            <div className="relative">
              {/* Status select — form field, rounded-none per blueprint §3 */}
              <select
                value={pendingStatus}
                onChange={e => setPendingStatus(e.target.value)}
                disabled={updateStatus.isPending}
                className="h-8.5 pl-2.5 pr-7 border border-neutral-300 rounded-none text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            {/* Save button — action control, rounded per hybrid rule (ADR-0006 §2) */}
            <button
              onClick={handleSaveStatus}
              disabled={updateStatus.isPending || pendingStatus === ticket.status}
              className="h-8.5 px-3.5 bg-blue-700 text-white rounded font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
            >
              {updateStatus.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}

        {readOnly && (
          <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-none px-2.5 py-1.5">
            Read-only — this ticket is assigned to another agent in your department.
          </p>
        )}
      </div>

      {/* Description + Metadata card — structural container, rounded-none (ADR-0006 §1) */}
      <div className="bg-white border border-neutral-200 rounded-none p-5">
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-7">
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-2.5">Description</h3>
            <p className="text-sm text-gray-700 leading-7">{ticket.description}</p>
          </div>
          <div className="md:border-l md:border-gray-200 md:pl-7 flex flex-col gap-3.5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Submitted By</p>
              <p className="text-sm font-medium text-gray-800">{ticket.creator?.name ?? '—'}</p>
              <p className="text-xs text-gray-500">{ticket.creator?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Assigned Agent</p>
              <p className="text-sm font-medium text-gray-800">{ticket.assignee?.name ?? 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm text-gray-600">{fmtDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Due</p>
              <p className="text-sm text-gray-600">{fmtDate(ticket.dueAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments card — structural container, rounded-none (ADR-0006 §1) */}
      <div className="bg-white border border-neutral-200 rounded-none p-5">
        <div className="flex items-center gap-2 mb-3.5">
          <h3 className="text-xs font-semibold text-gray-800">Attachments</h3>
          {/* Count badge — interactive micro-widget, rounded-full stays (ADR-0006 §2) */}
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">{attachments.length}</span>
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-400">No attachments.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {attachments.map(a => {
              const ext  = a.fileName?.split('.').pop()?.toLowerCase();
              const type = ext === 'pdf' ? 'pdf' : ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : ext === 'txt' ? 'text' : 'other';
              return (
                <div key={a.id} onClick={() => setViewingFile(a)}
                  className="flex items-center gap-3 px-2.5 py-2 rounded-none bg-white hover:bg-neutral-50/80 cursor-pointer transition-colors">
                  <FileTypeIcon type={type} />
                  <span className="flex-1 text-sm font-medium text-blue-600 overflow-hidden text-ellipsis whitespace-nowrap">{a.fileName}</span>
                  <span className="text-xs text-gray-400 shrink-0">{(a.fileSize / 1024).toFixed(1)} KB</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments */}
      <CommentSection ticketId={ticketId} />

      {/* File Viewer Modal */}
      {viewingFile && <FileViewer attachment={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}
