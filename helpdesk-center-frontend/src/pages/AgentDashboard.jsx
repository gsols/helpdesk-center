import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTickets } from '../api/ticketsApi';
import AppHeader from '../components/AppHeader';
import TicketCard from '../components/TicketCard';
import { ChevronDown } from 'lucide-react';

const ROLE_TITLE = {
  it_hardware: 'IT Hardware',
  it_software: 'IT Software',
  hr:          'HR',
};

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

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: ''
  });

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const queueTitle = ROLE_TITLE[user?.role] ? `${ROLE_TITLE[user.role]} Queue` : 'Support Queue';

  const filteredTickets = tickets
    .filter(t => {
      const created = new Date(t.createdAt);
      const from    = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to      = filters.dateTo   ? new Date(filters.dateTo + 'T23:59:59') : null;
      return (
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
    filters.status !== 'all'  || filters.priority !== 'all' ||
    filters.sort !== 'newest' || filters.dateFrom !== ''    || filters.dateTo !== '';

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <AppHeader user={user} onLogout={logout} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f2328' }}>{queueTitle}</h1>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82d4', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 10px', borderRadius: 999 }}>
            {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', minWidth: 'max-content' }}>
            {[
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
                onClick={() => setFilters({ status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' })}
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
            <EmptyState message="No tickets in your queue." />
          ) : filteredTickets.length === 0 ? (
            <EmptyState message="No tickets match the current filters." />
          ) : (
            filteredTickets.map(t => <TicketCard key={t.id} ticket={t} showSubmitter />)
          )}
        </div>
      </main>
    </div>
  );
}

const selectSt = { height: 34, paddingLeft: 10, paddingRight: 28, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer', appearance: 'none', outline: 'none' };
const dateSt   = { height: 34, padding: '0 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none', colorScheme: 'light' };
