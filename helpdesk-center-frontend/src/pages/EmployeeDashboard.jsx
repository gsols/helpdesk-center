import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTickets, createTicket, previewTicket } from '../api/ticketsApi';
import { uploadAttachment } from '../api/attachmentsApi';
import TicketCard from '../components/TicketCard';

const CATEGORY_LABEL = { hardware: 'IT Hardware', software: 'IT Software', hr: 'HR' };
const CATEGORY_COLOR = { hardware: '#1d4ed8', software: '#7c3aed', hr: '#065f46' };
const CATEGORY_BG    = { hardware: '#eff6ff', software: '#f5f3ff', hr: '#ecfdf5' };
const CATEGORY_BORDER = { hardware: '#bfdbfe', software: '#ddd6fe', hr: '#a7f3d0' };

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ title: '', description: '', email: user?.email || '' });
  const [file, setFile]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(null);

  // Preview state
  const [preview, setPreview]         = useState(null);   // { source, category, allowed, watsonKeywords }
  const [previewing, setPreviewing]   = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  // Auto-preview with 700 ms debounce whenever title or description changes
  useEffect(() => {
    const text = (form.title + ' ' + form.description).trim();
    if (text.length < 10) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewing(true);
      setPreviewError(null);
      try {
        const res = await previewTicket({ title: form.title, description: form.description });
        setPreview(res.data);
      } catch {
        setPreviewError('Could not reach the AI classifier. Please try again.');
        setPreview(null);
      } finally {
        setPreviewing(false);
      }
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [form.title, form.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preview?.allowed) return;   // guard: should never reach here due to disabled button
    setSubmitting(true);
    setSuccess(null);
    try {
      const res = await createTicket(form);
      const ticket = res.data;
      if (file) await uploadAttachment(ticket.id, file);
      setSuccess(ticket);
      setShowForm(false);
      setForm({ title: '', description: '', email: user?.email || '' });
      setFile(null);
      setPreview(null);
      const updated = await getTickets();
      setTickets(updated.data);
    } catch {
      alert('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = preview?.allowed === true && !submitting && !previewing;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>My Tickets</h1>
          <p style={{ color: '#57606a', fontSize: 13 }}>Welcome, {user?.fullName}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setShowForm(!showForm); setPreview(null); }} style={btnPrimary}>
            {showForm ? 'Cancel' : '+ New Ticket'}
          </button>
          <button onClick={logout} style={btnSecondary}>Logout</button>
        </div>
      </div>

      {success && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          Ticket <strong>#{success.id}</strong> submitted — Category: <strong>{success.category}</strong> · Priority: <strong>{success.priority}</strong>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Submit New Ticket</h2>

          <label style={labelStyle}>Title</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. My laptop screen is broken"
            required
          />

          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, height: 90, resize: 'vertical' }}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the issue in detail..."
            required
          />

          {/* AI Preview Panel */}
          {(previewing || preview || previewError) && (
            <div style={previewPanelStyle}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#57606a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Classification Preview
                {preview?.source === 'watson' && (
                  <span style={{ marginLeft: 8, background: '#dbeafe', color: '#1e40af', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                    Watson NLU
                  </span>
                )}
                {preview?.source === 'fallback' && (
                  <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                    Keyword Fallback
                  </span>
                )}
              </div>

              {previewing && <p style={{ fontSize: 13, color: '#57606a' }}>Analyzing with Watson NLU...</p>}

              {previewError && <p style={{ fontSize: 13, color: '#dc2626' }}>{previewError}</p>}

              {preview && !previewing && (
                <>
                  {/* Detected category badge */}
                  {preview.category ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: CATEGORY_BG[preview.category],
                      border: `1px solid ${CATEGORY_BORDER[preview.category]}`,
                      color: CATEGORY_COLOR[preview.category],
                      borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 600, marginBottom: 10
                    }}>
                      Detected category: {CATEGORY_LABEL[preview.category]}
                    </div>
                  ) : (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
                      <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, margin: 0 }}>
                        No work-related category detected
                      </p>
                      <p style={{ fontSize: 12, color: '#7f1d1d', margin: '4px 0 0' }}>
                        Your ticket must relate to IT Hardware, IT Software, or HR. Please revise the title and description.
                      </p>
                    </div>
                  )}

                  {/* Watson keyword explainability table */}
                  {preview.source === 'watson' && preview.watsonKeywords?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: '#57606a', margin: '0 0 6px', fontWeight: 600 }}>
                        Keywords extracted by Watson NLU:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {preview.watsonKeywords.map((kw, i) => (
                          <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            background: kw.matchedCategory ? CATEGORY_BG[kw.matchedCategory] : '#f1f5f9',
                            border: `1px solid ${kw.matchedCategory ? CATEGORY_BORDER[kw.matchedCategory] : '#e2e8f0'}`,
                            color: kw.matchedCategory ? CATEGORY_COLOR[kw.matchedCategory] : '#475569',
                          }}>
                            {kw.text}
                            <span style={{ opacity: 0.7, fontSize: 11 }}>{kw.relevance}%</span>
                            {kw.matchedCategory && (
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                                → {kw.matchedCategory}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <label style={labelStyle}>Contact Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />

          <label style={labelStyle}>Attachment (optional, max 10 MB)</label>
          <input type="file" accept=".jpg,.jpeg,.png,.gif,.pdf,.txt" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13 }} />

          {/* Submit — disabled unless AI confirmed a valid category */}
          <button type="submit" disabled={!canSubmit} style={{ ...btnPrimary, marginTop: 18, width: '100%', opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Submitting…' : previewing ? 'Classifying…' : !preview ? 'Waiting for classification…' : !preview.allowed ? 'Ticket blocked — not work-related' : 'Submit Ticket'}
          </button>
        </form>
      )}

      {tickets.length === 0 && !showForm
        ? <p style={{ color: '#57606a', textAlign: 'center', marginTop: 40 }}>No tickets yet. Submit your first ticket above.</p>
        : tickets.map(t => <TicketCard key={t.id} ticket={t} />)
      }
    </div>
  );
}

const pageStyle     = { maxWidth: 760, margin: '0 auto', padding: '28px 16px' };
const headerStyle   = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 };
const formStyle     = { background: '#f7f8fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 };
const labelStyle    = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, marginTop: 12 };
const inputStyle    = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const btnPrimary    = { padding: '8px 16px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const btnSecondary  = { padding: '8px 16px', background: '#f1f5f9', color: '#1f2328', border: '1px solid #e5e7eb', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const previewPanelStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', marginTop: 14, marginBottom: 4 };
