import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTickets, assignTicket } from '../api/ticketsApi';
import { getAgents } from '../api/usersApi';
import AppShell from '../components/AppShell';
import TicketCard from '../components/TicketCard';
import TicketDetailPanel from '../components/TicketDetailPanel';
import SplitPane from '../components/SplitPane';
import StatCard from '../components/StatCard';
import { T } from '../styles/tokens';
import { ChevronDown, CircleDot, Clock, CheckCircle2, Ticket, Users } from 'lucide-react';

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets,   setTickets]   = useState([]);
  const [agents,    setAgents]    = useState([]);
  const [maximized, setMaximized] = useState(false);
  const [filters, setFilters]     = useState({ status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' });

  const selectedId   = searchParams.get('ticket');
  const selectTicket = (t) => { setMaximized(false); setSearchParams({ ticket: t.id }); };
  const closePanel   = ()  => { setMaximized(false); setSearchParams({}); };

  const loadAll = () => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
    getAgents().then(r => setAgents(r.data)).catch(() => {});
  };
  useEffect(() => { loadAll(); }, []);

  const handleAssign = async (ticketId, agentId) => {
    if (!agentId) return;
    try {
      await assignTicket(ticketId, agentId);
      loadAll();
    } catch { alert('Could not assign ticket'); }
  };

  const filteredTickets = tickets
    .filter(t => {
      const created = new Date(t.createdAt);
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to   = filters.dateTo   ? new Date(filters.dateTo + 'T23:59:59') : null;
      return (
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
    filters.status !== 'all' || filters.priority !== 'all' ||
    filters.sort !== 'newest' || filters.dateFrom !== '' || filters.dateTo !== '';

  const openCount       = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount   = tickets.filter(t => t.status === 'resolved').length;

  const listContent = (
    <>
      <div style={selectedId ? { position: 'sticky', top: 0, zIndex: 10, background: T.surface, paddingBottom: 4 } : {}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>All Tickets</h2>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, background: T.accentLight, border: '1px solid #bfdbfe', padding: '2px 10px', borderRadius: T.radiusPill }}>
            {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textSecondary }}>
            <Users size={13} />{agents.length} agents
          </span>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: '12px 14px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={filterGroupLabelSt}>Filter</span>
            {[
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
              <button onClick={() => setFilters({ status: 'all', priority: 'all', sort: 'newest', dateFrom: '', dateTo: '' })}
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

      {/* Ticket list with assignment dropdowns */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {tickets.length === 0 ? <EmptyState message="No tickets in the system." />
          : filteredTickets.length === 0 ? <EmptyState message="No tickets match the current filters." />
          : filteredTickets.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TicketCard
                  ticket={t} showSubmitter
                  isSelected={String(t.id) === String(selectedId)}
                  onSelect={selectTicket}
                />
              </div>
              {/* Assign dropdown */}
              <div style={{ padding: '0 12px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={t.assignedTo?.id ?? ''}
                    onChange={e => handleAssign(t.id, e.target.value)}
                    style={{ ...selectSt, fontSize: 12, height: 30, paddingLeft: 8, paddingRight: 24 }}
                    title="Assign to agent"
                  >
                    <option value="">Unassigned</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.fullName ?? a.username}</option>)}
                  </select>
                  <ChevronDown size={10} color={T.textMuted} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );

  return (
    <AppShell title="Admin Dashboard">
      {!selectedId && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="Open"        count={openCount}       color={T.accent}  bg={T.accentLight} icon={CircleDot}    />
          <StatCard label="In Progress" count={inProgressCount} color="#7c3aed"   bg="#f5f3ff"       icon={Clock}        />
          <StatCard label="Resolved"    count={resolvedCount}   color={T.success} bg={T.successBg}   icon={CheckCircle2} />
          <StatCard label="Agents"      count={agents.length}   color={T.navy}    bg={T.accentLight}  icon={Users}       />
        </div>
      )}

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
      ) : listContent}

      <style>{`
        @media (max-width: 767px) {
          .split-list-col   { display: none !important; }
          .split-detail-col { flex: 1 1 100% !important; max-height: none !important; }
        }
      `}</style>
    </AppShell>
  );
}

const selectSt           = { height: 34, paddingLeft: 10, paddingRight: 28, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, fontSize: 13, background: '#fff', cursor: 'pointer', appearance: 'none', outline: 'none', color: T.textPrimary };
const dateSt             = { height: 34, padding: '0 10px', border: `1px solid ${T.border}`, borderRadius: T.radiusMd, fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none', colorScheme: 'light', color: T.textPrimary };
const filterGroupLabelSt = { fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const dateLabelSt        = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' };
