import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMyQueue, usePool, useArchive, useAssignToMe } from '../hooks/useTickets';
import AppShell from '../components/AppShell';
import TicketCard from '../components/TicketCard';
import TicketDetailPanel from '../components/TicketDetailPanel';
import SplitPane from '../components/SplitPane';
import StatCard from '../components/StatCard';
import TabBar from '../components/TabBar';
import RerouteModal from '../components/RerouteModal';
import { CircleDot, Clock, CheckCircle2, Ticket } from 'lucide-react';

function EmptyQueue({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-13 h-13 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
        <Ticket size={22} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

const TABS = [
  { id: 'myQueue', label: 'My Queue' },
  { id: 'pool',    label: 'Department Pool' },
  { id: 'archive', label: 'Archive' },
];

export default function AgentDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab]   = useState('myQueue');
  const [maximized, setMaximized]   = useState(false);
  const [rerouteTicket, setRerouteTicket] = useState(null);

  const selectedId = searchParams.get('ticket');
  const selectTicket = (t) => { setMaximized(false); setSearchParams({ ticket: t.id }); };
  const closePanel   = ()  => { setMaximized(false); setSearchParams({}); };

  // Three queue data sets (plan section 2B)
  const { data: myQueue  = [], isLoading: loadingMQ } = useMyQueue();
  const { data: pool     = [], isLoading: loadingPL } = usePool();
  const { data: archive  = [], isLoading: loadingAR } = useArchive();
  const assignToMe = useAssignToMe();

  const tickets   = activeTab === 'myQueue' ? myQueue : activeTab === 'pool' ? pool : archive;
  const isLoading = activeTab === 'myQueue' ? loadingMQ : activeTab === 'pool' ? loadingPL : loadingAR;
  const isReadOnly = activeTab === 'archive';

  // Stat counts (always from My Queue)
  const openCount       = myQueue.filter(t => t.status === 'OPEN').length;
  const inProgressCount = myQueue.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount   = myQueue.filter(t => t.status === 'RESOLVED').length;

  const handleClaimTicket = async (ticketId) => {
    try {
      await assignToMe.mutateAsync(ticketId);
    } catch {
      alert('Could not claim ticket');
    }
  };

  const tabsWithCounts = TABS.map(t => ({
    ...t,
    count: t.id === 'myQueue' ? myQueue.length : t.id === 'pool' ? pool.length : archive.length,
  }));

  const emptyMessages = {
    myQueue: 'No tickets assigned to you.',
    pool:    'Department pool is empty.',
    archive: 'No peer-assigned tickets in your department.',
  };

  /* ── List content ── */
  const listContent = (
    <div>
      <TabBar tabs={tabsWithCounts} value={activeTab} onChange={(id) => { setActiveTab(id); setSearchParams({}); }} />
      {/* Structural list container — rounded-none (ADR-0006 §1) */}
      <div className="mt-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
        {isLoading ? (
          <EmptyQueue message="Loading…" />
        ) : tickets.length === 0 ? (
          <EmptyQueue message={emptyMessages[activeTab]} />
        ) : (
          tickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              showSubmitter
              isSelected={String(t.id) === String(selectedId)}
              onSelect={selectTicket}
              showClaim={activeTab === 'pool'}
              onClaim={activeTab === 'pool' ? () => handleClaimTicket(t.id) : undefined}
            />
          ))
        )}
      </div>

      {activeTab === 'archive' && (
        <p className="text-xs text-gray-400 mt-2 px-1">
          Archive is read-only. Re-assign a ticket to yourself to edit it.
        </p>
      )}
    </div>
  );

  return (
    <AppShell title="Agent Workspace">
      {/* Stat cards — hidden in split mode */}
      {!selectedId && (
        <div className="flex gap-4 mb-5 flex-wrap">
          <StatCard label="My Open"      count={openCount}       color="#3b82d4" bg="#eff6ff" icon={CircleDot}    />
          <StatCard label="In Progress"  count={inProgressCount} color="#7c3aed" bg="#f5f3ff" icon={Clock}        />
          <StatCard label="My Resolved"  count={resolvedCount}   color="#15803d" bg="#f0fdf4" icon={CheckCircle2} />
        </div>
      )}

      {selectedId ? (
        maximized ? (
          <div className="overflow-y-auto max-h-[calc(100vh-88px)]">
            <TicketDetailPanel
              ticketId={selectedId}
              readOnly={isReadOnly}
              onClose={closePanel}
              onMinimize={() => setMaximized(false)}
              onReroute={setRerouteTicket}
            />
          </div>
        ) : (
          <SplitPane
            leftContent={listContent}
            rightContent={
              <TicketDetailPanel
                ticketId={selectedId}
                readOnly={isReadOnly}
                onClose={closePanel}
                onMaximize={() => setMaximized(true)}
                onReroute={setRerouteTicket}
              />
            }
          />
        )
      ) : (
        listContent
      )}

      {rerouteTicket && (
        <RerouteModal ticket={rerouteTicket} onClose={() => setRerouteTicket(null)} />
      )}
    </AppShell>
  );
}
