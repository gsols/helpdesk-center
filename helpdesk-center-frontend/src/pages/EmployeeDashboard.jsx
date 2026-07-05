import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTickets, createTicket, previewTicket } from '../api/ticketsApi';
import { uploadAttachment } from '../api/attachmentsApi';
import AppShell from '../components/AppShell';
import TicketCard from '../components/TicketCard';
import TicketDetailPanel from '../components/TicketDetailPanel';
import SplitPane from '../components/SplitPane';
import StatCard from '../components/StatCard';
import CategoryBadge from '../components/CategoryBadge';
import { T, cardStyle, btnPrimary } from '../styles/tokens';
import {
  Plus, X, Upload, Paperclip, Sparkles, Loader2, AlertCircle,
  ChevronDown, CircleDot, Clock, CheckCircle2, Ticket,
} from 'lucide-react';

const CATEGORY_LABEL  = { hardware: 'Hardware', software: 'Software', hr: 'HR' };
const CATEGORY_COLOR  = { hardware: '#1d4ed8', software: '#7c3aed', hr: '#065f46' };
const CATEGORY_BG     = { hardware: '#eff6ff', software: '#f5f3ff', hr: '#ecfdf5' };
const CATEGORY_BORDER = { hardware: '#bfdbfe', software: '#ddd6fe', hr: '#a7f3d0' };

/* ── New Ticket Drawer ───────────────────────────────────────────────────── */
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

  useEffect(() => {
    const text = (form.title + ' ' + form.description).trim();
    if (text.length < 10) { setPreview(null); setPreviewError(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewing(true); setPreviewError(null);
      try {
        const res = await previewTicket({ title: form.title, description: form.description });
        setPreview(res.data);
      } catch {
        setPreviewError('Could not reach the AI classifier.');
        setPreview(null);
      } finally { setPreviewing(false); }
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
    } catch { alert('Failed to submit ticket'); }
    finally  { setSubmitting(false); }
  };

  const canSubmit = preview?.allowed === true && !submitting && !previewing;

  const inputSt = (field) => ({
    width: '100%', height: 36, padding: '0 12px', boxSizing: 'border-box',
    border: `1px solid ${errors[field] ? T.danger : focusedField === field ? T.accent : T.border}`,
    borderRadius: T.radiusMd, fontSize: 13, outline: 'none', background: '#fff', color: T.textPrimary,
    boxShadow: focusedField === field ? `0 0 0 3px ${T.accentLight}` : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  });
  const textareaSt = (field) => ({ ...inputSt(field), height: 'auto', padding: '10px 12px', resize: 'vertical', minHeight: 100 });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.3)' }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, height: '100%',
        width: 'min(720px,100vw)', background: '#fff',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>New Support Ticket</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}><X size={18} /></button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Form */}
          <div style={{ flex: '1 1 300px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelSt}>Title <span style={{ color: T.danger }}>*</span></label>
              <input type="text" value={form.title} placeholder="Brief summary of your issue" style={inputSt('title')}
                onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(p => ({ ...p, title: undefined })); }} />
              {errors.title && <p style={errorSt}><AlertCircle size={11} /> {errors.title}</p>}
            </div>
            <div>
              <label style={labelSt}>Description <span style={{ color: T.danger }}>*</span></label>
              <textarea rows={5} value={form.description} placeholder="Describe the issue in detail"
                style={textareaSt('description')} onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)}
                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(p => ({ ...p, description: undefined })); }} />
              {errors.description && <p style={errorSt}><AlertCircle size={11} /> {errors.description}</p>}
            </div>
            <div>
              <label style={labelSt}>Contact Email</label>
              <input type="email" value={form.email} style={inputSt('email')}
                onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={labelSt}>Attachment <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>(optional, max 10 MB)</span></label>
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusMd, background: T.surface }}>
                  <Paperclip size={14} color={T.textSecondary} />
                  <span style={{ flex: 1, fontSize: 13, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}><X size={14} /></button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  style={{ border: `2px dashed ${isDragging ? T.accent : T.border}`, borderRadius: T.radiusLg, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: isDragging ? T.accentLight : T.surface, transition: 'border-color 0.15s, background 0.15s' }}>
                  <Upload size={20} color={T.textMuted} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: T.textSecondary }}>Drag & drop a file here, or <span style={{ color: T.accent, fontWeight: 500 }}>click to browse</span></p>
                  <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>PDF, PNG, JPG, TXT up to 10 MB</p>
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                </div>
              )}
            </div>
          </div>
          {/* AI Preview */}
          <div style={{ width: 220, flexShrink: 0, borderLeft: `1px solid ${T.border}`, background: T.surface, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} color={T.accent} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Classification</span>
            </div>
            {!previewing && !preview && !previewError && <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>Start typing — AI will predict the category and priority.</p>}
            {previewing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><p style={aiLabelSt}>Category</p><div style={{ height: 22, width: 80, background: T.border, borderRadius: 4 }} /></div>
                <div><p style={aiLabelSt}>Priority</p><div style={{ height: 22, width: 64, background: T.border, borderRadius: 4 }} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted }}>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />Detecting…
                </div>
              </div>
            )}
            {previewError && <p style={{ fontSize: 12, color: T.danger }}>{previewError}</p>}
            {preview && !previewing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {preview.category ? (
                  <>
                    <div><p style={aiLabelSt}>Category</p><CategoryBadge value={preview.category} /></div>
                    <div>
                      <p style={aiLabelSt}>Source</p>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: preview.source === 'watson' ? T.accentLight : '#fef3c7', color: preview.source === 'watson' ? '#1e40af' : '#92400e', border: `1px solid ${preview.source === 'watson' ? '#bfdbfe' : '#fde68a'}` }}>
                        {preview.source === 'watson' ? 'Watson NLU' : 'Keyword Fallback'}
                      </span>
                    </div>
                    {preview.watsonKeywords?.length > 0 && (
                      <div>
                        <p style={aiLabelSt}>Keywords</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {preview.watsonKeywords.map((kw, i) => (
                            <span key={i} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 500, background: kw.matchedCategory ? CATEGORY_BG[kw.matchedCategory] : '#f1f5f9', border: `1px solid ${kw.matchedCategory ? CATEGORY_BORDER[kw.matchedCategory] : '#e2e8f0'}`, color: kw.matchedCategory ? CATEGORY_COLOR[kw.matchedCategory] : '#475569' }}>
                              {kw.text} <span style={{ opacity: 0.7 }}>{kw.relevance}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.success, background: T.successBg, padding: '6px 10px', borderRadius: T.radiusMd, border: `1px solid ${T.successBorder}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, flexShrink: 0 }} />Auto-detected by AI
                    </div>
                  </>
                ) : (
                  <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: T.radiusMd, padding: '10px 12px' }}>
                    <p style={{ fontSize: 12, color: T.danger, fontWeight: 600, marginBottom: 4 }}>No work-related category detected</p>
                    <p style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5 }}>Your ticket must relate to Hardware, Software, or HR.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btnSecSt }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit} style={{ ...btnPrimary, background: canSubmit ? T.navy : T.accentMid, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Submitting…' : previewing ? 'Classifying…' : !preview ? 'Waiting for AI…' : !preview.allowed ? 'Ticket blocked' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ticket size={22} color={T.textMuted} />
      </div>
      <p style={{ fontSize: 14, color: T.textSecondary }}>{message}</p>
    </div>
  );
}

/* ── EmployeeDashboard ───────────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets,   setTickets]  = useState([]);
  const [showForm,  setShowForm] = useState(false);
  const [success,   setSuccess]  = useState(null);
  const [maximized, setMaximized] = useState(false);

  const [filters, setFilters] = useState({
    category: 'all', status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: ''
  });

  const selectedId = searchParams.get('ticket');
  const selectTicket = (t) => { setMaximized(false); setSearchParams({ ticket: t.id }); };
  const closePanel   = ()  => { setMaximized(false); setSearchParams({}); };

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const filteredTickets = tickets
    .filter(t => {
      const created = new Date(t.createdAt);
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to   = filters.dateTo   ? new Date(filters.dateTo + 'T23:59:59') : null;
      return (
        (filters.category === 'all' || t.category === filters.category) &&
        (filters.status   === 'all' || t.status   === filters.status)   &&
        (filters.priority === 'all' || t.priority === filters.priority) &&
        (!from || created >= from) && (!to || created <= to)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return filters.sort === 'newest' ? -diff : diff;
    });

  const hasActiveFilter =
    filters.category !== 'all' || filters.status !== 'all' || filters.priority !== 'all' ||
    filters.sort !== 'newest'  || filters.dateFrom !== ''  || filters.dateTo !== '';

  const openCount       = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount   = tickets.filter(t => t.status === 'resolved').length;

  const handleCreated = async (ticket) => {
    setSuccess(ticket);
    const updated = await getTickets();
    setTickets(updated.data);
  };

  /* ── List content (sticky header + filter + list) ── */
  const listContent = (
    <>
      <div style={selectedId ? { position: 'sticky', top: 0, zIndex: 10, background: T.surface, paddingBottom: 4 } : {}}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>My Tickets</h2>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, background: T.accentLight, border: `1px solid #bfdbfe`, padding: '2px 10px', borderRadius: T.radiusPill }}>
              {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
          <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, background: T.navy }}>
            <Plus size={14} strokeWidth={2.5} />New Ticket
          </button>
        </div>

        {/* Success banner */}
        {success && (
          <div style={{ background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: T.radiusLg, padding: '10px 14px', marginBottom: 12, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Ticket <strong>#{success.id}</strong> submitted — Category: <strong>{CATEGORY_LABEL[success.category] ?? success.category}</strong></span>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSecondary, display: 'flex' }}><X size={14} /></button>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: '12px 14px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={filterGroupLabelSt}>Filter</span>
            {[
              { key: 'category', opts: [['all','Category'],['hardware','Hardware'],['software','Software'],['hr','HR']] },
              { key: 'status',   opts: [['all','Status'],['open','Open'],['in_progress','In Progress'],['resolved','Resolved']] },
              { key: 'priority', opts: [['all','Priority'],['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']] },
            ].map(({ key, opts }) => (
              <div key={key} style={{ position: 'relative' }}>
                <select value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))} style={selectSt}>
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={11} color={T.textMuted} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            ))}
            <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />
            <span style={filterGroupLabelSt}>Sort</span>
            <div style={{ position: 'relative' }}>
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} style={selectSt}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown size={11} color={T.textMuted} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            {hasActiveFilter && (
              <button onClick={() => setFilters({ category: 'all', status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' })}
                style={{ marginLeft: 'auto', fontSize: 12, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                Clear filters
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={filterGroupLabelSt}>Date</span>
            <label style={dateLabelSt}>From<input type="date" style={dateSt} value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} /></label>
            <label style={dateLabelSt}>To<input type="date" style={dateSt} value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} /></label>
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {tickets.length === 0 ? <EmptyState message="No tickets yet. Submit your first ticket using '+ New Ticket'." />
          : filteredTickets.length === 0 ? <EmptyState message="No tickets match the current filters." />
          : filteredTickets.map(t => (
            <TicketCard key={t.id} ticket={t} isSelected={String(t.id) === String(selectedId)} onSelect={selectTicket} />
          ))}
      </div>
    </>
  );

  return (
    <AppShell title="My Tickets">
      {/* Stat cards — hidden in split/maximized mode */}
      {!selectedId && (
        <>
          {/* Welcome banner */}
          <div style={{ background: `linear-gradient(135deg, ${T.navy} 0%, #2a4a73 100%)`, borderRadius: T.radiusXl, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, color: T.accentLight, fontWeight: 500, marginBottom: 4 }}>Welcome back</p>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff' }}>{user?.fullName ?? user?.username}</h2>
            </div>
            <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, background: '#ffffff', color: T.navy, gap: 6 }}>
              <Plus size={14} strokeWidth={2.5} />Submit New Ticket
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard label="Open Tickets"     count={openCount}       color={T.accent}   bg={T.accentLight}  icon={CircleDot}    />
            <StatCard label="In Progress"      count={inProgressCount} color="#7c3aed"    bg="#f5f3ff"        icon={Clock}        />
            <StatCard label="Resolved"         count={resolvedCount}   color={T.success}  bg={T.successBg}    icon={CheckCircle2} />
          </div>
        </>
      )}

      {/* Split / list view */}
      {selectedId ? (
        <div>
          {maximized ? (
            <div className="split-detail-col" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 88px)' }}>
              <TicketDetailPanel ticketId={selectedId} onClose={closePanel} onMinimize={() => setMaximized(false)} />
            </div>
          ) : (
            <SplitPane
              leftContent={listContent}
              rightContent={<TicketDetailPanel ticketId={selectedId} onClose={closePanel} onMaximize={() => setMaximized(true)} />}
            />
          )}
        </div>
      ) : (
        listContent
      )}

      {showForm && <NewTicketDrawer user={user} onClose={() => setShowForm(false)} onCreated={handleCreated} />}

      <style>{`
        @media (max-width: 767px) {
          .split-list-col   { display: none !important; }
          .split-detail-col { flex: 1 1 100% !important; max-height: none !important; }
        }
      `}</style>
    </AppShell>
  );
}

const labelSt          = { display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 };
const errorSt          = { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.danger, marginTop: 4 };
const btnSecSt         = { height: 36, padding: '0 16px', fontSize: 13, fontWeight: 500, color: T.textSecondary, background: '#fff', border: `1px solid ${T.border}`, borderRadius: T.radiusMd, cursor: 'pointer' };
const aiLabelSt        = { fontSize: 11, fontWeight: 600, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };
const selectSt         = { height: 34, paddingLeft: 10, paddingRight: 28, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, fontSize: 13, background: '#fff', cursor: 'pointer', appearance: 'none', outline: 'none', color: T.textPrimary };
const dateSt           = { height: 34, padding: '0 10px', border: `1px solid ${T.border}`, borderRadius: T.radiusMd, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none', colorScheme: 'light', color: T.textPrimary };
const filterGroupLabelSt = { fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const dateLabelSt      = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' };
