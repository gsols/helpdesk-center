import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTickets } from '../api/ticketsApi';
import TicketCard from '../components/TicketCard';

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' });

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const roleLabel = {
    it_hardware: 'IT Hardware',
    it_software: 'IT Software',
    hr:          'HR',
  }[user?.role] || user?.role;

  const filteredTickets = tickets
    .filter(t => {
      const created = new Date(t.createdAt);
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to   = filters.dateTo   ? new Date(filters.dateTo + 'T23:59:59') : null;
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
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{roleLabel} Queue</h1>
          <p style={{ color: '#57606a', fontSize: 13 }}>Welcome, {user?.fullName} · {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={logout} style={btnSecondary}>Logout</button>
      </div>

      {tickets.length > 0 && (
        <div style={filterBarStyle}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={selectStyle} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select style={selectStyle} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select style={selectStyle} value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <input type="date" style={dateStyle} value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} title="From date" />
            <input type="date" style={dateStyle} value={filters.dateTo}   onChange={e => setFilters(f => ({ ...f, dateTo:   e.target.value }))} title="To date" />
            {hasActiveFilter && (
              <button onClick={() => setFilters({ status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' })} style={clearBtnStyle}>
                Clear filters
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#57606a', whiteSpace: 'nowrap' }}>
            Showing {filteredTickets.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {tickets.length === 0
        ? <p style={{ color: '#57606a', textAlign: 'center', marginTop: 40 }}>No tickets in your queue.</p>
        : filteredTickets.length === 0
          ? <p style={{ color: '#57606a', textAlign: 'center', marginTop: 24 }}>No tickets match the current filters.</p>
          : filteredTickets.map(t => <TicketCard key={t.id} ticket={t} />)
      }
    </div>
  );
}

const pageStyle      = { maxWidth: 760, margin: '0 auto', padding: '28px 16px' };
const headerStyle    = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 };
const btnSecondary   = { padding: '8px 16px', background: '#f1f5f9', color: '#1f2328', border: '1px solid #e5e7eb', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const filterBarStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' };
const selectStyle    = { padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer' };
const dateStyle      = { padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', cursor: 'pointer', colorScheme: 'light' };
const clearBtnStyle  = { fontSize: 12, color: '#3b82d4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 };
