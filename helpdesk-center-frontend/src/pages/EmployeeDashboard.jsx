/**
 * EmployeeDashboard — "my_tickets" + "my_tickets_ai_triage_breakdown" wireframes
 *
 * Layout (matches wireframe exactly):
 *  • 260px labeled sidebar (Support Engine ALPHA header, Main Menu nav items, user profile at bottom)
 *  • Top bar: OmniSupport breadcrumb + tenant + clock + bell
 *  • Main content: "The Ticket Dropper Form" + "The Employee Personal Grid"
 *
 * Form layout:
 *  • Left col (fluid): REQUEST TITLE input + MARKDOWN DESCRIPTION textarea
 *  • Center col (fluid): DEPARTMENT select + ATTACHMENT DROPZONE
 *  • Right col (220px): AI CONFIDENCE BREAKDOWN panel
 *  • Top-right: Save Draft + Submit Ticket buttons
 */
import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useTickets, useCreateTicket } from '../hooks/useTickets';
import { useAuth }                     from '../context/AuthContext';
import StatusBadge                     from '../components/StatusBadge';
import {
  Bold, Italic, List, Code, UploadCloud,
  Filter, RefreshCw, ExternalLink, ChevronLeft, ChevronRight,
  Cpu,
} from 'lucide-react';

const DEPARTMENTS = [
  'Technical Support', 'Security', 'Internal IT', 'Network',
  'Engineering', 'Finance & Payroll', 'HR',
];

const AI_BREAKDOWN = [
  { label: 'Technical Support',    pct: 88, color: '#3b82f6' },
  { label: 'Security',             pct: 7,  color: '#64748b' },
  { label: 'IT Infrastructure',    pct: 5,  color: '#94a3b8' },
];

const PAGE_SIZE = 10;

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: tickets = [] }   = useTickets();
  const { mutateAsync: createTicket, isPending: isCreating } = useCreateTicket();

  const [title,      setTitle]      = useState('');
  const [desc,       setDesc]       = useState('');
  const [dept,       setDept]       = useState(DEPARTMENTS[0]);
  const [submitDone, setSubmitDone] = useState(false);
  const [page,       setPage]       = useState(1);

  const myTickets = tickets
    .filter(t => !user?.id || t.reporterId === user.id || t.createdById === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(myTickets.length / PAGE_SIZE));
  const pageItems  = myTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTicket({ title, description: desc, departmentName: dept });
      setTitle(''); setDesc(''); setSubmitDone(true);
      setTimeout(() => setSubmitDone(false), 3000);
    } catch { /* API error — ignored */ }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
            <button style={btnSecondary}>Save Draft</button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              style={{
                ...btnPrimary,
                background: isCreating ? '#374151' : '#0f172a',
                cursor: isCreating ? 'not-allowed' : 'pointer',
              }}
            >
              {submitDone ? '✓ Submitted' : isCreating ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </div>

        {/* Form grid — 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 220px', gap: 20 }}>
          {/* Left: Title + Markdown Description */}
          <div style={{ gridColumn: '1' }}>
            {/* Request Title */}
            <div style={{ marginBottom: 16 }}>
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
              {/* Toolbar */}
              <div style={{
                display: 'flex', gap: 2, padding: '6px 8px',
                border: '1px solid #e2e8f0', borderBottom: 'none', borderRadius: '6px 6px 0 0',
                background: '#f8fafc',
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
                rows={8}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #e2e8f0', borderRadius: '0 0 6px 6px',
                  fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                  color: '#0f172a', resize: 'vertical', outline: 'none',
                  background: '#ffffff', boxSizing: 'border-box',
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>

          {/* Center: Department + Dropzone */}
          <div style={{ gridColumn: '2' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Department</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', paddingRight: 32 }}
                >
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>▾</span>
              </div>
            </div>

            {/* Attachment Dropzone */}
            <div>
              <label style={labelStyle}>Attachment Dropzone</label>
              <div
                style={{
                  border: '1.5px dashed #cbd5e1', borderRadius: 6,
                  minHeight: 160, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#f8fafc', cursor: 'pointer', padding: 16,
                }}
              >
                <UploadCloud size={28} color="#94a3b8" />
                <span style={{ fontSize: 13, color: '#64748b' }}>Drag files here or</span>
                <span style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>browse</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>MAX 25MB (PNG, JPG, PDF, ZIP)</span>
              </div>
            </div>
          </div>

          {/* Right: AI Confidence Breakdown */}
          <div style={{ gridColumn: '3' }}>
            <label style={labelStyle}>AI Confidence Breakdown</label>
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 6, padding: '12px 14px',
            }}>
              {AI_BREAKDOWN.map(({ label, pct, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Classified by watsonx.ai
              </div>
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
            <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
              <Filter size={16} />
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['ID', 'TITLE', 'DEPARTMENT', 'DATE CREATED', 'STATUS', ''].map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No tickets found. Submit your first ticket above.
                </td>
              </tr>
            ) : pageItems.map((t) => (
              <tr
                key={t.id}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'default' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: '#334155', fontWeight: 600, fontSize: 13 }}>
                  #{t.id ?? t.ticketId ?? 'TK-???'}
                </td>
                <td style={{ ...tdStyle, maxWidth: 240 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{t.title}</div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {t.description}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>{t.departmentName ?? t.department?.name ?? '—'}</td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{fmtDate(t.createdAt)}</td>
                <td style={tdStyle}><StatusBadge status={t.status} /></td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
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
            Showing {pageItems.length} of {myTickets.length} tickets
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

// ── Local style constants ─────────────────────────────────────────────────────
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
