import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import AppShell from '../components/AppShell';
import TicketCard from '../components/TicketCard';
import TicketDetailPanel from '../components/TicketDetailPanel';
import SplitPane from '../components/SplitPane';
import StatCard from '../components/StatCard';
import TabBar from '../components/TabBar';
import SlaConfigPanel from '../components/SlaConfigPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import TriageQueue from '../components/TriageQueue';
import { CircleDot, Clock, CheckCircle2, Users } from 'lucide-react';

const ADMIN_TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'sla',        label: 'SLA Rules' },
  { id: 'analytics',  label: 'Analytics' },
  { id: 'triage',     label: 'Triage Queue' },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [maximized, setMaximized] = useState(false);

  const selectedId = searchParams.get('ticket');
  const selectTicket = (t) => { setMaximized(false); setSearchParams({ ticket: t.id }); };
  const closePanel   = ()  => { setMaximized(false); setSearchParams({}); };

  const { data: tickets = [], isLoading } = useTickets();

  const openCount       = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount   = tickets.filter(t => t.status === 'RESOLVED').length;

  /* ── Overview ticket list ── */
  const ticketList = (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {isLoading ? (
        <p className="text-sm text-gray-400 p-5">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-gray-400 p-5">No tickets.</p>
      ) : (
        tickets.map(t => (
          <TicketCard
            key={t.id}
            ticket={t}
            showSubmitter
            isSelected={String(t.id) === String(selectedId)}
            onSelect={selectTicket}
          />
        ))
      )}
    </div>
  );

  const overviewContent = (
    <div>
      <div className="flex gap-4 mb-5 flex-wrap">
        <StatCard label="Open Tickets"  count={openCount}       color="#3b82d4" bg="#eff6ff" icon={CircleDot}    />
        <StatCard label="In Progress"   count={inProgressCount} color="#7c3aed" bg="#f5f3ff" icon={Clock}        />
        <StatCard label="Resolved"      count={resolvedCount}   color="#15803d" bg="#f0fdf4" icon={CheckCircle2} />
      </div>
      {selectedId ? (
        maximized ? (
          <div className="overflow-y-auto max-h-[calc(100vh-88px)]">
            <TicketDetailPanel ticketId={selectedId} onClose={closePanel} onMinimize={() => setMaximized(false)} />
          </div>
        ) : (
          <SplitPane
            leftContent={ticketList}
            rightContent={
              <TicketDetailPanel ticketId={selectedId} onClose={closePanel} onMaximize={() => setMaximized(true)} />
            }
          />
        )
      ) : (
        ticketList
      )}
    </div>
  );

  return (
    <AppShell title="Admin Dashboard">
      <TabBar tabs={ADMIN_TABS} value={activeTab} onChange={setActiveTab} />
      <div className="mt-5">
        {activeTab === 'overview'  && overviewContent}
        {activeTab === 'sla'       && (
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-4">SLA Rule Configuration</h2>
            <SlaConfigPanel />
          </div>
        )}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Performance Analytics</h2>
            <AnalyticsPanel />
          </div>
        )}
        {activeTab === 'triage'    && (
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Triage Queue</h2>
            <TriageQueue />
          </div>
        )}
      </div>
    </AppShell>
  );
}
