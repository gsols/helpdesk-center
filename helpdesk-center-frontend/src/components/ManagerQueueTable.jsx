/**
 * ManagerQueueTable — "department_manager_active_queue_table" wireframe
 *
 * Columns: TICKET ID | SUBJECT | STATUS | ASSIGNED AGENT (dropdown) | SLA TRACKING
 * Footer: status legend dots + last sync time
 */
import { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import StatusBadge from './StatusBadge';
import { Search, Bell, ChevronDown } from 'lucide-react';

const AGENTS = ['Alex Rivera', 'Sarah Jenkins', 'Daniel Park', 'Fatima Al Zahra', 'Unassigned'];

function SlaCell({ ticket }) {
  if (!ticket.dueAt) return <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>;

  const now      = Date.now();
  const due      = new Date(ticket.dueAt).getTime();
  const created  = new Date(ticket.createdAt).getTime();
  const total    = due - created;
  const elapsed  = now - created;
  const pct      = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const minsLeft = Math.max(0, Math.round((due - now) / 60000));

  if (ticket.status === 'RESOLVED') {
    const resolvedIn = ticket.resolvedAt ? Math.round((new Date(ticket.resolvedAt) - created) / 60000) : null;
    return (
      <div>
        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: '100%', background: '#22c55e' }} />
        </div>
        <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
          Met{resolvedIn ? ` (Resolved in ${Math.round(resolvedIn / 60)}h)` : ''}
        </span>
      </div>
    );
  }

  if (due < now) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>⚠ BREACHED EXPIRED BY {Math.round((now - due) / 60000)}M</span>
      </div>
    );
  }

  const color = pct > 80 ? '#dc2626' : pct > 60 ? '#f59e0b' : '#22c55e';
  const h     = Math.floor(minsLeft / 60);
  const m     = minsLeft % 60;

  return (
    <div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>
        {h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`}
        {pct > 80 && ` (High Urgency)`}
      </span>
    </div>
  );
}

export default function ManagerQueueTable() {
  const { data: tickets = [], isLoading } = useTickets();
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgent,  setFilterAgent]  = useState('');

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || t.title?.toLowerCase().includes(q) || String(t.id).includes(q);
    const matchS = !filterStatus || t.status === filterStatus;
    const matchA = !filterAgent  || t.assignee?.name === filterAgent;
    return matchQ && matchS && matchA;
  });

  const openCount      = tickets.filter(t => t.status === 'OPEN').length;
  const inProgCount    = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const breachedCount  = tickets.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'RESOLVED').length;

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 0, overflow: 'hidden' }}>
      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 12px', height: 36, background: '#f8fafc' }}>
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter department queue by keyword or tag…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#0f172a' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ height: 36, padding: '0 28px 0 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, appearance: 'none', background: '#fff', color: '#374151', outline: 'none', cursor: 'pointer' }}>
            <option value="">Filter Status ▾</option>
            {['OPEN','IN_PROGRESS','RESOLVED','CRITICAL'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
            style={{ height: 36, padding: '0 28px 0 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, appearance: 'none', background: '#fff', color: '#374151', outline: 'none', cursor: 'pointer' }}>
            <option value="">Filter Agent ▾</option>
            {AGENTS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <button style={{ height: 36, padding: '0 14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          New Ticket
        </button>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {['TICKET ID', 'SUBJECT', 'STATUS', 'ASSIGNED AGENT', 'SLA TRACKING'].map((h) => (
              <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'left', borderRight: '1px solid #f1f5f9' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No tickets found.</td></tr>
          ) : filtered.map(t => (
            <tr
              key={t.id}
              style={{ borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#3b82f6', cursor: 'pointer' }}>
                  #TK-{t.id}
                </span>
              </td>
              <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9', fontSize: 13, color: '#0f172a', maxWidth: 320 }}>
                {t.title}
              </td>
              <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9' }}>
                <StatusBadge status={t.status} />
              </td>
              <td style={{ padding: '14px 16px', borderRight: '1px solid #f1f5f9' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    defaultValue={t.assignee?.name ?? ''}
                    style={{
                      height: 30, padding: '0 28px 0 10px', border: '1px solid #e2e8f0',
                      borderRadius: 6, fontSize: 13, background: '#fff', color: '#0f172a',
                      appearance: 'none', outline: 'none', cursor: 'pointer',
                      borderColor: !t.assignee ? '#fca5a5' : '#e2e8f0',
                    }}
                  >
                    <option value="">Unassigned</option>
                    {AGENTS.map(a => <option key={a}>{a}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                </div>
              </td>
              <td style={{ padding: '14px 16px', minWidth: 180 }}>
                <SlaCell ticket={t} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[
            { color: '#22c55e', label: `${openCount} Open` },
            { color: '#3b82f6', label: `${inProgCount} In Progress` },
            { color: '#dc2626', label: `${breachedCount} Breached` },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>Last sync: 24s ago</span>
      </div>
    </div>
  );
}
