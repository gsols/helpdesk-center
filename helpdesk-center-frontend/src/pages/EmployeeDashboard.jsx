import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTickets, createTicket, previewTicket } from '../api/ticketsApi';
import { uploadAttachment } from '../api/attachmentsApi';
import AppHeader from '../components/AppHeader';
import TicketCard from '../components/TicketCard';
import CategoryBadge from '../components/CategoryBadge';
import {
  Plus, X, Upload, Paperclip, Sparkles, Loader2, AlertCircle, ChevronDown
} from 'lucide-react';

const CATEGORY_LABEL  = { hardware: 'Hardware', software: 'Software', hr: 'HR' };
const CATEGORY_COLOR  = { hardware: '#1d4ed8', software: '#7c3aed', hr: '#065f46' };
const CATEGORY_BG     = { hardware: '#eff6ff', software: '#f5f3ff', hr: '#ecfdf5' };
const CATEGORY_BORDER = { hardware: '#bfdbfe', software: '#ddd6fe', hr: '#a7f3d0' };

/* ── Drawer ────────────────────────────────────────────────────────────────── */
function NewTicketDrawer({ user, onClose, onCreated }) {
  const [form, setForm]               = useState({ title: '', description: '', email: user?.email || '' });
  const [file, setFile]               = useState(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});
  const [preview, setPreview]         = useState(null);
  const [previewing, setPreviewing]   = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const fileInputRef = useRef(null);
  const debounceRef  = useRef(null);

  // AI preview debounce
  useEffect(() => {
    const text = (form.title + ' ' + form.description).trim();
    if (text.length < 10) { setPreview(null); setPreviewError(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewing(true);
      setPreviewError(null);
      try {
        const res = await previewTicket({ title: form.title, description: form.description });
        setPreview(res.data);
      } catch {
        setPreviewError('Could not reach the AI classifier.');
        setPreview(null);
      } finally {
        setPreviewing(false);
      }
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [form.title, form.description]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    if (!preview?.allowed) return;
    setSubmitting(true);
    try {
      const res    = await createTicket(form);
      const ticket = res.data;
      if (file) await uploadAttachment(ticket.id, file);
      onCreated(ticket);
      onClose();
    } catch {
      alert('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = preview?.allowed === true && !submitting && !previewing;

  const inputSt = (field) => ({
    width:        '100%',
    height:       36,
    padding:      '0 12px',
    border:       `1px solid ${errors[field] ? '#dc2626' : focusedField === field ? '#3b82d4' : '#d1d5db'}`,
    borderRadius: 6,
    fontSize:     13,
    boxSizing:    'border-box',
    outline:      'none',
    boxShadow:    focusedField === field ? '0 0 0 3px rgba(59,130,212,0.15)' : 'none',
    transition:   'border-color 0.15s, box-shadow 0.15s',
  });

  const textareaSt = (field) => ({
    ...inputSt(field),
    height:  'auto',
    padding: '10px 12px',
    resize:  'vertical',
    minHeight: 100,
  });

  /* ── Responsive: drawer is 720px on desktop, 100% on mobile ── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />

      {/* Drawer panel */}
      <div style={{
        position:   'absolute',
        right:      0,
        top:        0,
        height:     '100%',
        width:      'min(720px, 100vw)',
        background: '#ffffff',
        boxShadow:  '-4px 0 24px rgba(0,0,0,0.12)',
        display:    'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1f2328' }}>New Support Ticket</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body: form + AI panel side-by-side on desktop, stacked on mobile */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Form */}
          <div style={{ flex: '1 1 300px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Title */}
            <div>
              <label style={labelSt}>Title <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                value={form.title}
                placeholder="Brief summary of your issue"
                style={inputSt('title')}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(p => ({ ...p, title: undefined })); }}
              />
              {errors.title && <p style={errorSt}><AlertCircle size={11} /> {errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={labelSt}>Description <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea
                rows={5}
                value={form.description}
                placeholder="Describe the issue in detail — steps to reproduce, what you expected, what happened"
                style={textareaSt('description')}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(p => ({ ...p, description: undefined })); }}
              />
              {errors.description && <p style={errorSt}><AlertCircle size={11} /> {errors.description}</p>}
            </div>

            {/* Contact email */}
            <div>
              <label style={labelSt}>Contact Email</label>
              <input
                type="email"
                value={form.email}
                style={inputSt('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            {/* File upload */}
            <div>
              <label style={labelSt}>Attachment <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>(optional, max 10 MB)</span></label>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#f9fafb' }}>
                  <Paperclip size={14} color="#57606a" />
                  <span style={{ flex: 1, fontSize: 13, color: '#1f2328', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  style={{
                    border:       `2px dashed ${isDragging ? '#3b82d4' : '#d1d5db'}`,
                    borderRadius: 8,
                    padding:      '28px 20px',
                    textAlign:    'center',
                    cursor:       'pointer',
                    background:   isDragging ? '#eff6ff' : '#fafbfc',
                    transition:   'border-color 0.15s, background 0.15s',
                  }}
                >
                  <Upload size={20} color="#9ca3af" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#57606a' }}>
                    Drag & drop a file here, or <span style={{ color: '#3b82d4', fontWeight: 500 }}>click to browse</span>
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PDF, PNG, JPG, TXT up to 10 MB</p>
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                </div>
              )}
            </div>
          </div>

          {/* AI preview panel */}
          <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid #e5e7eb', background: '#fafbfc', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} color="#3b82d4" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2328', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Classification</span>
            </div>

            {!previewing && !preview && !previewError && (
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                Start typing — AI will predict the category and priority.
              </p>
            )}

            {previewing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Category</p>
                  <div style={{ height: 22, width: 80, background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Priority</p>
                  <div style={{ height: 22, width: 64, background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  Detecting…
                </div>
              </div>
            )}

            {previewError && <p style={{ fontSize: 12, color: '#dc2626' }}>{previewError}</p>}

            {preview && !previewing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {preview.category ? (
                  <>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Category</p>
                      <CategoryBadge value={preview.category} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Source</p>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                        background: preview.source === 'watson' ? '#dbeafe' : '#fef3c7',
                        color:      preview.source === 'watson' ? '#1e40af' : '#92400e',
                        border:     `1px solid ${preview.source === 'watson' ? '#bfdbfe' : '#fde68a'}`,
                      }}>
                        {preview.source === 'watson' ? 'Watson NLU' : 'Keyword Fallback'}
                      </span>
                    </div>
                    {preview.watsonKeywords?.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#57606a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Keywords</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {preview.watsonKeywords.map((kw, i) => (
                            <span key={i} style={{
                              fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 500,
                              background: kw.matchedCategory ? CATEGORY_BG[kw.matchedCategory] : '#f1f5f9',
                              border:     `1px solid ${kw.matchedCategory ? CATEGORY_BORDER[kw.matchedCategory] : '#e2e8f0'}`,
                              color:      kw.matchedCategory ? CATEGORY_COLOR[kw.matchedCategory] : '#475569',
                            }}>
                              {kw.text} <span style={{ opacity: 0.7 }}>{kw.relevance}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#15803d', background: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d', flexShrink: 0 }} />
                      Auto-detected by AI
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px' }}>
                    <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>No work-related category detected</p>
                    <p style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5 }}>
                      Your ticket must relate to Hardware, Software, or HR. Please revise the title and description.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              height: 36, padding: '0 20px', fontSize: 13, fontWeight: 600,
              color: '#fff', background: canSubmit ? '#3b82d4' : '#93c5fd',
              border: 'none', borderRadius: 6, cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Submitting…' : previewing ? 'Classifying…' : !preview ? 'Waiting for AI…' : !preview.allowed ? 'Ticket blocked' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EmployeeDashboard ─────────────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [success, setSuccess]     = useState(null);

  const [filters, setFilters] = useState({
    category: 'all', status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: ''
  });

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const filteredTickets = tickets
    .filter(t => {
      const created = new Date(t.createdAt);
      const from    = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to      = filters.dateTo   ? new Date(filters.dateTo + 'T23:59:59') : null;
      return (
        (filters.category === 'all' || t.category === filters.category) &&
        (filters.status   === 'all' || t.status   === filters.status)   &&
        (filters.priority === 'all' || t.priority === filters.priority) &&
        (!from || created >= from) &&
        (!to   || created <= to)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return filters.sort === 'newest' ? -diff : diff;
    });

  const hasActiveFilter =
    filters.category !== 'all' || filters.status !== 'all' || filters.priority !== 'all' ||
    filters.sort !== 'newest'  || filters.dateFrom !== ''  || filters.dateTo !== '';

  const handleCreated = async (ticket) => {
    setSuccess(ticket);
    const updated = await getTickets();
    setTickets(updated.data);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <AppHeader user={user} onLogout={logout} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2328' }}>My Tickets</h1>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82d4', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 10px', borderRadius: 999 }}>
              {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Ticket
          </button>
        </div>

        {/* Success banner */}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Ticket <strong>#{success.id}</strong> submitted — Category: <strong>{CATEGORY_LABEL[success.category] ?? success.category}</strong></span>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#57606a', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', minWidth: 'max-content' }}>
            {[
              { key: 'category', opts: [['all','Category'],['hardware','Hardware'],['software','Software'],['hr','HR']] },
              { key: 'status',   opts: [['all','Status'],['open','Open'],['in_progress','In Progress'],['resolved','Resolved']] },
              { key: 'priority', opts: [['all','Priority'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']] },
            ].map(({ key, opts }) => (
              <div key={key} style={{ position: 'relative' }}>
                <select
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  style={selectSt}
                >
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={11} color="#9ca3af" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            ))}
            <input type="date" style={dateSt} value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} title="From date" />
            <input type="date" style={dateSt} value={filters.dateTo}   onChange={e => setFilters(f => ({ ...f, dateTo:   e.target.value }))} title="To date" />
            {hasActiveFilter && (
              <button
                onClick={() => setFilters({ category: 'all', status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' })}
                style={{ fontSize: 13, color: '#3b82d4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Clear filters
              </button>
            )}
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} style={selectSt}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown size={11} color="#9ca3af" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Ticket list */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.04)' }}>
          {tickets.length === 0 ? (
            <EmptyState message="No tickets yet. Submit your first ticket using '+ New Ticket'." />
          ) : filteredTickets.length === 0 ? (
            <EmptyState message="No tickets match the current filters." />
          ) : (
            filteredTickets.map(t => <TicketCard key={t.id} ticket={t} />)
          )}
        </div>
      </main>

      {showForm && (
        <NewTicketDrawer
          user={user}
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <p style={{ fontSize: 14, color: '#57606a' }}>{message}</p>
    </div>
  );
}

const labelSt     = { display: 'block', fontSize: 13, fontWeight: 600, color: '#1f2328', marginBottom: 6 };
const errorSt     = { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', marginTop: 4 };
const btnSecondary = { height: 36, padding: '0 16px', fontSize: 13, fontWeight: 500, color: '#57606a', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' };
const selectSt    = { height: 34, paddingLeft: 10, paddingRight: 28, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer', appearance: 'none', outline: 'none' };
const dateSt      = { height: 34, padding: '0 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none', colorScheme: 'light' };
