/**
 * EmployeeDashboard — "my_tickets" + "my_tickets_ai_triage_breakdown" wireframes
 *
 * Form layout:
 *  • Left col (3fr): REQUEST TITLE + MARKDOWN DESCRIPTION
 *  • Right col (1fr): ATTACHMENT DROPZONE (functional) + AI CONFIDENCE BREAKDOWN (live)
 *  • Department selector removed — routing determined by watsonx.ai NLU
 *
 * Submit flow:
 *  1. POST /api/tickets  → returns ticket with id
 *  2. POST /api/tickets/{id}/attachments (multipart) for each queued file
 *  3. Invalidate tickets query → grid refreshes automatically
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../components/AppShell';
import { useTickets, useCreateTicket, usePreviewTicket } from '../hooks/useTickets';
import { useUploadAttachment }  from '../hooks/useAttachments';
import { useAuth }              from '../context/AuthContext';
import StatusBadge              from '../components/StatusBadge';
import { useNavigate }          from 'react-router-dom';
import {
  Bold, Italic, List, Code, UploadCloud,
  Filter, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  Cpu, X, FileText, Image, FileArchive,
} from 'lucide-react';

// Maps Watson category keys → display department names (must match DataSeeder exactly)
const CATEGORY_DISPLAY = {
  hardware: 'IT Hardware',
  software: 'IT Software',
  hr:       'HR',
};

// Allowed MIME types (must match backend FileStorageUtil)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
const MAX_BYTES     = 10 * 1024 * 1024; // 10 MB

const PAGE_SIZE = 10;

/* ── File type icon ─────────────────────────────────────────────────────────── */
function FileIcon({ type }) {
  if (type?.startsWith('image/')) return <Image size={14} color="#3b82f6" />;
  if (type === 'application/pdf') return <FileText size={14} color="#dc2626" />;
  return <FileArchive size={14} color="#64748b" />;
}

/* ── Attachment Dropzone ────────────────────────────────────────────────────── */
function AttachmentDropzone({ files, onAdd, onRemove }) {
  const inputRef  = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [errors,   setErrors]   = useState([]);

  const validate = (fileList) => {
    const valid = [];
    const errs  = [];
    Array.from(fileList).forEach(f => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        errs.push(`${f.name}: unsupported type (PNG, JPG, GIF, PDF, TXT only)`);
      } else if (f.size > MAX_BYTES) {
        errs.push(`${f.name}: exceeds 10 MB limit`);
      } else {
        valid.push(f);
      }
    });
    if (errs.length) setErrors(errs);
    else setErrors([]);
    if (valid.length) onAdd(valid);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    validate(e.dataTransfer.files);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div style={{ minWidth: 0 }}>
      {/* Drop area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          border: `1.5px dashed ${dragging ? '#3b82f6' : '#cbd5e1'}`,
          borderRadius: 8,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          background: dragging ? '#eff6ff' : '#f8fafc',
          cursor: 'pointer', padding: '20px 16px',
          textAlign: 'center',
          transition: 'border-color 150ms, background 150ms',
        }}
      >
        <UploadCloud size={24} color={dragging ? '#3b82f6' : '#94a3b8'} />
        <span style={{ fontSize: 12, color: '#64748b' }}>
          Drag files here or{' '}
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>browse</span>
        </span>
        <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.04em' }}>
          PNG, JPG, GIF, PDF, TXT · max 10 MB
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => { validate(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Validation errors */}
      {errors.map((err, i) => (
        <div key={i} style={{ marginTop: 4, fontSize: 11, color: '#dc2626' }}>{err}</div>
      ))}

      {/* Queued file list */}
      {files.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px',
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4,
              minWidth: 0,
            }}>
              <FileIcon type={f.type} />
              <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex', alignItems: 'center' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Watson keyword chips ───────────────────────────────────────────────────── */
function KeywordChips({ keywords, source }) {
  if (!keywords?.length) {
    // Fallback source — show a single badge instead of chips
    if (source === 'fallback') {
      return (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            padding: '1px 6px', borderRadius: 3,
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            fontSize: 9, fontWeight: 700, color: '#94a3b8',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            fallback · no watson keywords
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {source === 'fallback' && (
        <span style={{
          padding: '1px 5px', borderRadius: 3,
          background: '#f1f5f9', border: '1px solid #e2e8f0',
          fontSize: 9, fontWeight: 700, color: '#94a3b8',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          fallback
        </span>
      )}
      {keywords.map((kw, i) => {
        const matched = !!kw.matchedCategory;
        return (
          <span
            key={i}
            title={matched ? `matched: ${kw.matchedCategory} · ${kw.relevance}%` : `relevance: ${kw.relevance}%`}
            style={{
              padding: '1px 6px', borderRadius: 3,
              background: matched ? '#eff6ff' : '#f8fafc',
              border:     matched ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              fontSize: 10,
              fontWeight: matched ? 700 : 400,
              color:      matched ? '#1d4ed8' : '#64748b',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'default',
            }}
          >
            {kw.text}
            <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.6 }}>{kw.relevance}%</span>
          </span>
        );
      })}
    </div>
  );
}

/* ── AI Confidence Breakdown Panel ─────────────────────────────────────────── */
function AiBreakdownPanel({ previewData, isLoading, hasInput }) {
  if (!hasInput) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        padding: '20px 12px',
        border: '1px solid #f1f5f9', borderRadius: 6,
        background: 'rgba(248,250,252,0.5)',
        textAlign: 'center',
        minHeight: 80,
      }}>
        <Cpu size={18} color="#cbd5e1" />
        <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: '18px', fontStyle: 'italic' }}>
          Describe your issue and our AI will classify it for you.
        </span>
      </div>
    );
  }

  if (isLoading || !previewData) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        border: '1px solid #f1f5f9', borderRadius: 6,
        background: 'rgba(248,250,252,0.5)',
        minHeight: 40,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#3b82f6', display: 'inline-block',
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
          Analysing…
        </span>
      </div>
    );
  }

  const { category, confidence, allowed, watsonKeywords = [], source } = previewData;

  if (!allowed || !category) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 10px',
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4,
        }}>
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#92400e' }}>
            Routing to triage (low confidence)
          </span>
          {confidence > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>
              {Math.round(confidence)}%
            </span>
          )}
        </div>
        <KeywordChips keywords={watsonKeywords} source={source} />
      </div>
    );
  }

  const displayName = CATEGORY_DISPLAY[category] ?? category;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px',
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4,
      }}>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#0f172a' }}>
          {displayName}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>
          {Math.round(confidence)}%
        </span>
      </div>
      <KeywordChips keywords={watsonKeywords} source={source} />
    </div>
  );
}

/* ── EmployeeDashboard ──────────────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { data: tickets = [], refetch } = useTickets();
  const { mutateAsync: createTicket, isPending: isCreating } = useCreateTicket();
  const uploadAttachment = useUploadAttachment();
  const previewMutation  = usePreviewTicket();

  const [title,      setTitle]      = useState('');
  const [desc,       setDesc]       = useState('');
  const [files,      setFiles]      = useState([]);   // queued File objects
  const [submitDone, setSubmitDone] = useState(false);
  const [uploadErr,  setUploadErr]  = useState(null);
  const [page,       setPage]       = useState(1);

  // Derived flag — true when either field has content
  const hasInput = title.trim().length > 0 || desc.trim().length > 0;

  // 500ms debounced AI preview call
  useEffect(() => {
    if (!hasInput) {
      previewMutation.reset();
      return;
    }
    const timer = setTimeout(() => {
      previewMutation.mutate({ title, description: desc });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc]);

  // Filter to this user's tickets using the nested creator object
  const myTickets = tickets
    .filter(t => t.creator?.id === user?.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(myTickets.length / PAGE_SIZE));
  const pageItems  = myTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setUploadErr(null);
    try {
      // Step 1: create the ticket
      const res    = await createTicket({ title, description: desc });
      const ticket = res.data;
      const ticketId = ticket.id;

      // Step 2: upload each queued file sequentially
      for (const file of files) {
        try {
          await uploadAttachment.mutateAsync({ ticketId, file });
        } catch {
          setUploadErr(`Failed to upload "${file.name}" — ticket was saved, try re-attaching later.`);
        }
      }

      // Step 3: reset form
      setTitle('');
      setDesc('');
      setFiles([]);
      previewMutation.reset();
      setSubmitDone(true);
      setTimeout(() => setSubmitDone(false), 3000);

      // Grid refreshes automatically via useCreateTicket onSuccess invalidation
    } catch {
      setUploadErr('Failed to submit ticket. Please try again.');
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isSubmitting = isCreating || uploadAttachment.isPending;

  return (
    <AppShell title="Dashboard">
      {/* ── Ticket Dropper Form ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        {/* Form header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
              The Ticket Dropper Form
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Need assistance? File a new request with precise information.
            </div>
            {/* watsonx.ai badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 8, padding: '3px 8px',
              background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4,
              fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.05em',
            }}>
              <Cpu size={11} />
              WATSONX.AI: INTENT CLASSIFICATION ACTIVE
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => { setTitle(''); setDesc(''); setFiles([]); previewMutation.reset(); }}
              style={btnSecondary}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              style={{
                ...btnPrimary,
                background: isSubmitting ? '#374151' : '#0f172a',
                cursor: (isSubmitting || !title.trim()) ? 'not-allowed' : 'pointer',
                opacity: !title.trim() ? 0.6 : 1,
              }}
            >
              {submitDone
                ? '✓ Submitted'
                : isCreating
                  ? 'Submitting…'
                  : uploadAttachment.isPending
                    ? `Uploading files…`
                    : 'Submit Ticket'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {uploadErr && (
          <div style={{
            marginBottom: 12, padding: '8px 12px',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4,
            fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {uploadErr}
            <button type="button" onClick={() => setUploadErr(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2 }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Form grid — 2 columns: left 3fr, right 1fr */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>

          {/* Left: Title + Markdown Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Request Title */}
            <div>
              <label style={labelStyle}>Request Title</label>
              <input
                type="text"
                placeholder="e.g. Access issues with Tenant Alpha dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Markdown Description */}
            <div>
              <label style={labelStyle}>Markdown Description</label>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{
                  display: 'flex', gap: 2, padding: '6px 10px',
                  background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                }}>
                  {[Bold, Italic, List, Code].map((Icon, i) => (
                    <button key={i} type="button" style={{
                      background: 'transparent', border: 'none', color: '#64748b',
                      cursor: 'pointer', padding: '3px 6px', borderRadius: 4,
                    }}>
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Describe the issue... Use markdown for formatting."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={7}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: 'none', outline: 'none',
                    fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                    color: '#0f172a', resize: 'vertical',
                    background: '#ffffff', boxSizing: 'border-box',
                    lineHeight: 1.6,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Attachment Dropzone + AI Confidence Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Functional Attachment Dropzone */}
            <div style={{ minWidth: 0 }}>
              <label style={labelStyle}>
                Attachment Dropzone
                {files.length > 0 && (
                  <span style={{
                    marginLeft: 6, padding: '1px 6px',
                    background: '#dbeafe', borderRadius: 10,
                    fontSize: 10, fontWeight: 700, color: '#1d4ed8',
                  }}>
                    {files.length}
                  </span>
                )}
              </label>
              <AttachmentDropzone
                files={files}
                onAdd={handleAddFiles}
                onRemove={handleRemoveFile}
              />
            </div>

            {/* AI Confidence Breakdown — live, debounced */}
            <div>
              <label style={labelStyle}>AI Confidence Breakdown</label>
              <AiBreakdownPanel
                previewData={previewMutation.data ?? null}
                isLoading={previewMutation.isPending}
                hasInput={hasInput}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Employee Personal Grid ──────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: 20, padding: 0 }}>
        {/* Grid header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            The Employee Personal Grid
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => refetch()}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['ID', 'TITLE', 'DEPARTMENT', 'ASSIGNED AGENT', 'DATE CREATED', 'STATUS', ''].map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myTickets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No tickets found. Submit your first ticket above.
                </td>
              </tr>
            ) : pageItems.map((t) => (
              <tr
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: '#334155', fontWeight: 600, fontSize: 13 }}>
                  #TK-{t.id}
                </td>
                <td style={{ ...tdStyle, maxWidth: 240 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{t.title}</div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {t.description}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>{t.department?.name ?? '—'}</td>
                <td style={tdStyle}>
                  {t.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#1e293b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
                      }}>
                        {t.assignee.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span>{t.assignee.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Unassigned</span>
                  )}
                </td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{fmtDate(t.createdAt)}</td>
                <td style={tdStyle}><StatusBadge status={t.status} /></td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${t.id}`); }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                  >
                    <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 20px', borderTop: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Showing {pageItems.length} of {myTickets.length} ticket{myTickets.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ ...paginBtn, opacity: page === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ ...paginBtn, opacity: page === totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────
const cardStyle = {
  background: '#ffffff',
  border:     '1px solid #e2e8f0',
  borderRadius: 0,
  padding:    20,
};

const labelStyle = {
  display:       'block',
  fontSize:      11,
  fontWeight:    700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color:         '#64748b',
  marginBottom:  6,
};

const inputStyle = {
  width:        '100%',
  height:       36,
  padding:      '0 12px',
  border:       '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize:     14,
  outline:      'none',
  background:   '#ffffff',
  color:        '#0f172a',
  boxSizing:    'border-box',
  display:      'block',
};

const btnPrimary = {
  height: 34, padding: '0 16px',
  background: '#0f172a', color: '#ffffff',
  border: 'none', borderRadius: 6,
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const btnSecondary = {
  height: 34, padding: '0 16px',
  background: '#ffffff', color: '#374151',
  border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};

const thStyle = {
  padding:       '10px 16px',
  fontSize:      11,
  fontWeight:    700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color:         '#94a3b8',
  textAlign:     'left',
  whiteSpace:    'nowrap',
};

const tdStyle = {
  padding:  '14px 16px',
  fontSize: 13,
  color:    '#374151',
};

const paginBtn = {
  width: 28, height: 28,
  border: '1px solid #e2e8f0', borderRadius: 4,
  background: '#ffffff', color: '#64748b',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
