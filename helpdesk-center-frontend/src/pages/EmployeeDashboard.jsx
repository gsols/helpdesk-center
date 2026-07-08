import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTickets, useCreateTicket } from '../hooks/useTickets';
import { previewTicket } from '../api/ticketsApi';
import { uploadAttachment } from '../api/attachmentsApi';
import AppShell from '../components/AppShell';
import TicketCard from '../components/TicketCard';
import TicketDetailPanel from '../components/TicketDetailPanel';
import SplitPane from '../components/SplitPane';
import CategoryBadge from '../components/CategoryBadge';
import {
  Plus, X, Upload, Paperclip, Sparkles, Loader2, AlertCircle,
  ChevronDown, CircleDot, Clock, CheckCircle2, Ticket,
} from 'lucide-react';

/* ── New Ticket Drawer ───────────────────────────────────────────────────── */
function NewTicketDrawer({ user, onClose, onCreated }) {
  const createTicket = useCreateTicket();
  const [form, setForm]                 = useState({ title: '', description: '', email: user?.email || '' });
  const [file, setFile]                 = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [errors, setErrors]             = useState({});
  const [preview, setPreview]           = useState(null);
  const [previewing, setPreviewing]     = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const fileInputRef = useRef(null);
  const debounceRef  = useRef(null);

  useEffect(() => {
    const text = (form.title + ' ' + form.description).trim();
    clearTimeout(debounceRef.current);
    if (text.length < 10) {
      debounceRef.current = setTimeout(() => {
        setPreview(null);
        setPreviewError(null);
      }, 0);
      return () => clearTimeout(debounceRef.current);
    }
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
    try {
      const ticket = await createTicket.mutateAsync(form);
      if (file) await uploadAttachment(ticket.id, file);
      onCreated(ticket);
      onClose();
    } catch { alert('Failed to submit ticket'); }
  };

  const canSubmit = preview?.allowed === true && !createTicket.isPending && !previewing;

  return (
    <div className="fixed inset-0 z-50 flex">
    <div onClick={onClose} className="absolute inset-0 bg-slate-900/30" />
    {/* Drawer panel — structural container, rounded-none */}
    <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white rounded-none flex flex-col border-l border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200 shrink-0">
          <h2 className="text-base font-bold text-gray-900">New Support Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex items-center">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-wrap">
          {/* Form */}
          <div className="flex-1 min-w-64 p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                placeholder="Brief summary of your issue"
                className={`w-full h-9 px-3 border rounded-none text-sm outline-none bg-white text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(p => ({ ...p, title: undefined })); }}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                  <AlertCircle size={11} /> {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={form.description}
                placeholder="Describe the issue in detail"
                className={`w-full px-3 py-2.5 border rounded-none text-sm outline-none bg-white text-gray-900 resize-vertical min-h-24 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
                onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(p => ({ ...p, description: undefined })); }}
              />
              {errors.description && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                  <AlertCircle size={11} /> {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={form.email}
                className="w-full h-9 px-3 border border-gray-300 rounded-none text-sm outline-none bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Attachment <span className="text-xs text-gray-400 font-normal">(optional, max 10 MB)</span>
              </label>
              {file ? (
                <div className="flex items-center gap-2.5 px-3 py-2 border border-neutral-200 rounded-none bg-gray-50">
                  <Paperclip size={14} className="text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 flex items-center">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  className={`border-2 border-dashed rounded-none p-7 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <Upload size={20} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Drag & drop a file here, or <span className="text-blue-500 font-medium">click to browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, TXT up to 10 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* AI Preview panel */}
          <div className="w-56 shrink-0 border-l border-gray-200 bg-gray-50 p-4 flex flex-col gap-3.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">AI Classification</span>
            </div>
            {!previewing && !preview && !previewError && (
              <p className="text-xs text-gray-400 leading-relaxed">Start typing — AI will predict the category and priority.</p>
            )}
            {previewing && (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</p>
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priority</p>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 size={11} className="animate-spin" /> Detecting…
                </div>
              </div>
            )}
            {previewError && <p className="text-xs text-red-500">{previewError}</p>}
            {preview && !previewing && (
              <div className="flex flex-col gap-3">
                {preview.category ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</p>
                      <CategoryBadge value={preview.category} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Source</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${preview.source === 'watson' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {preview.source === 'watson' ? 'Watson NLU' : 'Keyword Fallback'}
                      </span>
                    </div>
                    {preview.watsonKeywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {preview.watsonKeywords.map((kw, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-gray-100 border border-gray-200 text-gray-600">
                              {kw.text} <span className="opacity-70">{kw.relevance}%</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1.5 rounded-md border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                      Auto-detected by AI
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-xs text-red-600 font-semibold mb-1">No work-related category detected</p>
                    <p className="text-xs text-red-800 leading-relaxed">Your ticket must relate to Hardware, Software, or HR.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-gray-200 shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`h-9 px-4 text-sm font-semibold text-white rounded transition-colors ${canSubmit ? 'bg-blue-700 hover:bg-blue-800 cursor-pointer' : 'bg-blue-300 cursor-not-allowed'}`}
          >
            {createTicket.isPending ? 'Submitting…' : previewing ? 'Classifying…' : !preview ? 'Waiting for AI…' : !preview.allowed ? 'Ticket blocked' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({ label, count, colorClass, bgClass, icon: Icon }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-none border border-neutral-200 bg-white flex-1 min-w-32`}>
      <div className={`w-9 h-9 rounded ${bgClass} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={colorClass} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{count}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-13 h-13 rounded-none bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
        <Ticket size={22} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/* ── EmployeeDashboard ───────────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: tickets = [], isLoading } = useTickets();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm,  setShowForm]  = useState(false);
  const [success,   setSuccess]   = useState(null);
  const [maximized, setMaximized] = useState(false);

  const [filters, setFilters] = useState({
    category: 'all', status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '',
  });

  const selectedId = searchParams.get('ticket');
  const selectTicket = (t) => { setMaximized(false); setSearchParams({ ticket: t.id }); };
  const closePanel   = ()  => { setMaximized(false); setSearchParams({}); };

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

  const openCount       = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount   = tickets.filter(t => t.status === 'RESOLVED').length;

  const handleCreated = (ticket) => {
    setSuccess(ticket);
    qc.invalidateQueries({ queryKey: ['tickets'] });
  };

  const listContent = (
    <>
      <div className={selectedId ? 'sticky top-0 z-10 bg-gray-50 pb-1' : ''}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-gray-900">My Tickets</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
              {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded cursor-pointer transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} /> New Ticket
          </button>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-none px-3.5 py-2.5 mb-3 text-sm">
            <span>
              Ticket <strong>#{success.id}</strong> submitted — Category: <strong>{success.category}</strong>
            </span>
            <button onClick={() => setSuccess(null)} className="text-gray-400 hover:text-gray-600 flex items-center ml-2">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white border border-neutral-200 rounded-none px-3.5 py-3 mb-3 flex flex-col gap-2.5">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Filter</span>
            {[
              { key: 'category', opts: [['all','Category'],['hardware','Hardware'],['software','Software'],['hr','HR']] },
              { key: 'status',   opts: [['all','Status'],['OPEN','Open'],['IN_PROGRESS','In Progress'],['PENDING_EMPLOYEE','Pending'],['RESOLVED','Resolved'],['CLOSED','Closed']] },
              { key: 'priority', opts: [['all','Priority'],['CRITICAL','Critical'],['HIGH','High'],['MEDIUM','Medium'],['LOW','Low']] },
            ].map(({ key, opts }) => (
              <div key={key} className="relative">
                <select
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  className="h-8 pl-2.5 pr-7 border border-neutral-300 rounded-none text-sm bg-white cursor-pointer appearance-none outline-none text-gray-800"
                >
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            ))}
            <div className="w-px h-5 bg-gray-200 shrink-0" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Sort</span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="h-8 pl-2.5 pr-7 border border-neutral-300 rounded-none text-sm bg-white cursor-pointer appearance-none outline-none text-gray-800"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
            {hasActiveFilter && (
              <button
                onClick={() => setFilters({ category: 'all', status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' })}
                className="ml-auto text-xs text-blue-500 bg-transparent border-none cursor-pointer underline whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</span>
            <label className="flex flex-col gap-0.5 text-xs font-semibold text-gray-400 uppercase tracking-tight">
              From
              <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="h-8 px-2.5 border border-neutral-300 rounded-none text-sm bg-white text-gray-800 outline-none cursor-pointer [color-scheme:light]" />
            </label>
            <label className="flex flex-col gap-0.5 text-xs font-semibold text-gray-400 uppercase tracking-tight">
              To
              <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="h-8 px-2.5 border border-neutral-300 rounded-none text-sm bg-white text-gray-800 outline-none cursor-pointer [color-scheme:light]" />
            </label>
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <div className="bg-white border border-neutral-200 rounded-none overflow-hidden">
        {isLoading         ? <EmptyState message="Loading tickets…" />
          : tickets.length === 0   ? <EmptyState message="No tickets yet. Submit your first ticket using '+ New Ticket'." />
          : filteredTickets.length === 0 ? <EmptyState message="No tickets match the current filters." />
          : filteredTickets.map(t => (
            <TicketCard key={t.id} ticket={t} isSelected={String(t.id) === String(selectedId)} onSelect={selectTicket} />
          ))}
      </div>
    </>
  );

  return (
    <AppShell title="My Tickets">
      {!selectedId && (
        <>
          {/* Welcome banner */}
          <div className="rounded-none bg-blue-900 px-6 py-5 mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-blue-200 font-medium mb-1">Welcome back</p>
              <h2 className="text-xl font-bold text-white">{user?.name ?? user?.email}</h2>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-blue-900 bg-white hover:bg-blue-50 rounded cursor-pointer transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} /> Submit New Ticket
            </button>
          </div>

          {/* Stat cards */}
          <div className="flex gap-4 mb-5 flex-wrap">
            <StatCard label="Open Tickets" count={openCount}       colorClass="text-blue-500"  bgClass="bg-blue-50"   icon={CircleDot}    />
            <StatCard label="In Progress"  count={inProgressCount} colorClass="text-violet-600" bgClass="bg-violet-50" icon={Clock}        />
            <StatCard label="Resolved"     count={resolvedCount}   colorClass="text-green-600"  bgClass="bg-green-50"  icon={CheckCircle2} />
          </div>
        </>
      )}

      {selectedId ? (
        <div>
          {maximized ? (
            <div className="split-detail-col overflow-y-auto max-h-[calc(100vh-88px)]">
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
