/**
 * TriageQueue — wireframes:
 *  1. global_triage_triagequeue.jsx — unassigned ticket queue with metric banner + AI text extraction
 *  2. admin_ticket_inspection_panel — click ticket → 480px AI triage side-drawer (AI log + Administrative Overrides)
 */
import { useState } from 'react';
import { useTriageQueue, useRerouteTicket } from '../hooks/useTickets';
import api from '../api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Filter, X, TriangleAlert, Terminal, ChevronDown } from 'lucide-react';

function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });
}

/* ── AI Triage Side Drawer ───────────────────────────────────────────────── */
function AiTriageDrawer({ ticket, departments, onClose }) {
  const rerouteTicket = useRerouteTicket();
  const [forcedDept,  setForcedDept]  = useState('');
  const [forcedAgent, setForcedAgent] = useState('');

  const handleOverride = async () => {
    if (!forcedDept) return;
    await rerouteTicket.mutateAsync({ id: ticket.id, targetDepartmentId: Number(forcedDept) });
    onClose();
  };

  const confidence = 41.20;
  const lowConf    = confidence < 60;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
      background: '#ffffff', borderLeft: '1px solid #e2e8f0',
      zIndex: 60, display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Drawer header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ padding: '2px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#15803d' }}>Acme Corp</span>
          <span style={{ padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#475569' }}>OPEN</span>
          <span style={{ padding: '2px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#dc2626' }}>HIGH</span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '20px', flex: 1 }}>
        {/* Ticket title */}
        <h2 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16, fontWeight: 700, color: '#0f172a',
          lineHeight: '22px', marginBottom: 16,
        }}>
          [#TK-{ticket.id}] {ticket.title}
        </h2>

        {/* Requester message */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            👤 REQUESTER MESSAGE
          </div>
          <p style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', lineHeight: '20px', margin: 0 }}>
            "{ticket.description ?? 'No description provided.'}"
          </p>
        </div>

        {/* AI TRIAGE ANALYTICS LOG */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#374151' }}>
              AI TRIAGE ANALYTICS LOG
            </span>
          </div>

          {/* Predicted Target + Confidence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                PREDICTED TARGET
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {ticket.department?.name ?? 'IT Support'}
              </div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                CONFIDENCE
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: lowConf ? '#dc2626' : '#15803d' }}>
                {confidence}%
              </div>
            </div>
          </div>

          {/* Low confidence warning */}
          {lowConf && (
            <div style={{
              display: 'flex', gap: 10, padding: '10px 14px',
              background: '#fffbeb', border: '1px solid #fde68a',
              borderLeft: '4px solid #f59e0b', borderRadius: 4, marginBottom: 12,
            }}>
              <TriangleAlert size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>
                  [ BREACHED / BELOW 60.00% GATEWAY ]
                </div>
                <div style={{ fontSize: 12, color: '#b45309' }}>
                  Manual intervention required for accurate department routing.
                </div>
              </div>
            </div>
          )}

          {/* Footer metadata */}
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em' }}>
            LATENCY: 1.24s | MODEL: WATSONX-GEN-2 | STATUS: PENDING_OVERRIDE
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
          {/* ADMINISTRATIVE OVERRIDES */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#374151', marginBottom: 16 }}>
            ADMINISTRATIVE OVERRIDES
          </div>

          {/* Forced Department Assignment */}
          <div style={{ marginBottom: 14 }}>
            <label style={drawerLabelStyle}>FORCED DEPARTMENT ASSIGNMENT</label>
            <div style={{ position: 'relative' }}>
              <select
                value={forcedDept}
                onChange={(e) => setForcedDept(e.target.value)}
                style={{ ...drawerSelectStyle }}
              >
                <option value="">Select Department…</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Forced Assignee Override */}
          <div style={{ marginBottom: 20 }}>
            <label style={drawerLabelStyle}>FORCED ASSIGNEE OVERRIDE</label>
            <div style={{ position: 'relative' }}>
              <select
                value={forcedAgent}
                onChange={(e) => setForcedAgent(e.target.value)}
                style={{ ...drawerSelectStyle, color: forcedAgent ? '#0f172a' : '#94a3b8' }}
              >
                <option value="">Select Agent…</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Apply Override button */}
          <button
            onClick={handleOverride}
            disabled={rerouteTicket.isPending}
            style={{
              width: '100%', height: 44,
              background: rerouteTicket.isPending ? '#374151' : '#0f172a',
              color: '#ffffff', border: 'none', borderRadius: 4,
              fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: rerouteTicket.isPending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Terminal size={15} />
            {rerouteTicket.isPending ? 'Applying…' : 'Apply Override & Re-Route'}
          </button>

          <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
            Action will be logged in the system audit trail.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TriageQueue (main) ──────────────────────────────────────────────────── */
export default function TriageQueue() {
  const { data: tickets = [], isLoading } = useTriageQueue();
  const { data: departments = [] }        = useDepartments();
  const rerouteTicket = useRerouteTicket();

  const [selections,    setSelections]    = useState({});
  const [search,        setSearch]        = useState('');
  const [activeFilter,  setActiveFilter]  = useState('UNASSIGNED'); // UNASSIGNED | CRITICAL
  const [selectedTicket,setSelectedTicket]= useState(null);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || String(t.id).toLowerCase().includes(q) || (t.title ?? '').toLowerCase().includes(q);
    const matchFilter = activeFilter === 'UNASSIGNED' ? !t.assigneeId : t.priority === 'CRITICAL';
    return matchSearch && matchFilter;
  });

  const unassignedCount = tickets.filter(t => !t.assigneeId).length;
  const criticalCount   = tickets.filter(t => t.priority === 'CRITICAL').length;

  if (isLoading) return <p style={{ padding: 24, fontSize: 13, color: '#64748b' }}>Loading triage queue…</p>;

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Top Metric Banner ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { label: 'Unassigned Triage Volume', value: tickets.length, extra: tickets.length > 0 ? <span style={needsActionBadge}>Needs Action</span> : null },
          { label: 'Avg Uncategorized Wait Time', value: '1h 24m', extra: <div style={{ flex: 1, height: 4, background: '#f1f5f9', maxWidth: 120, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: '65%', background: '#f59e0b' }} /></div> },
          { label: 'SLA Breach Probability',      value: '12%',    extra: <span style={{ padding: '2px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#15803d' }}>LOW RISK</span> },
          { label: 'Queue Capacity',              value: '88%',    extra: <div style={{ flex: 1, height: 4, background: '#f1f5f9', maxWidth: 120, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: '88%', background: '#0f172a' }} /></div> },
        ].map(({ label, value, extra }, i) => (
          <div key={i} style={{ flex: 1, padding: '16px 20px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</span>
              {extra}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter strip ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px', height: 44, gap: 12 }}>
        <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search triage queue by ticket ID or raw text payload…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#0f172a' }}
        />
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {[
            { key: 'UNASSIGNED', label: `UNASSIGNED (${unassignedCount})` },
            { key: 'CRITICAL',   label: `CRITICAL (${criticalCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                height: 28, padding: '0 12px',
                background: activeFilter === key ? '#0f172a' : '#ffffff',
                color: activeFilter === key ? '#ffffff' : '#64748b',
                border: '1px solid #e2e8f0', borderRadius: 4,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </button>
          ))}
          <button style={{ height: 28, padding: '0 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={11} /> Sync Queue
          </button>
        </div>
      </div>

      {/* ── Triage Table ─────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
            {tickets.length === 0 ? 'Triage queue is empty.' : 'No tickets match your search.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['TICKET ID', 'SUBJECT', 'SUBMISSION DATE', 'AI RAW TEXT EXTRACTION', 'ASSIGNED DEPARTMENT'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'left', whiteSpace: 'nowrap', borderRight: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const deptVal = selections[t.id] ?? '';
                return (
                  <tr
                    key={t.id}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onClick={() => setSelectedTicket(t)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
                        #TK-{t.id}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9', maxWidth: 240 }}>
                      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-CA') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9', maxWidth: 280 }}>
                      <span style={{ fontSize: 13, color: '#374151', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        "{t.description?.slice(0, 80) ?? '—'}"
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={deptVal}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelections(prev => ({ ...prev, [t.id]: v }));
                            if (v) rerouteTicket.mutate({ id: t.id, targetDepartmentId: Number(v) });
                          }}
                          style={{ width: '100%', height: 32, padding: '0 28px 0 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, appearance: 'none', background: '#fff', color: deptVal ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">Choose Department…</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          Showing {filtered.length} of {tickets.length} unassigned tickets
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['‹', '1', '›'].map((p, i) => (
            <button key={i} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 4, background: i === 1 ? '#0f172a' : '#fff', color: i === 1 ? '#fff' : '#64748b', fontSize: 13, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Triage Side Drawer ─────────────────────────────────────────── */}
      {selectedTicket && (
        <>
          <div
            onClick={() => setSelectedTicket(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 50 }}
          />
          <AiTriageDrawer
            ticket={selectedTicket}
            departments={departments}
            onClose={() => setSelectedTicket(null)}
          />
        </>
      )}
    </div>
  );
}

/* ── Style constants ─────────────────────────────────────────────────────── */
const needsActionBadge = {
  padding: '2px 8px', background: '#fffbeb', border: '1px solid #fde68a',
  borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#b45309',
};

const drawerLabelStyle = {
  display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6,
};

const drawerSelectStyle = {
  width: '100%', height: 40, padding: '0 36px 0 12px',
  border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 13, color: '#0f172a', background: '#ffffff',
  appearance: 'none', outline: 'none', cursor: 'pointer',
  boxSizing: 'border-box',
};
