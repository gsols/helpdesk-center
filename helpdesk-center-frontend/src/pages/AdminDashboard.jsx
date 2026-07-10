import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTickets } from '../hooks/useTickets';
import { deleteAllTickets } from '../api/ticketsApi';
import AppShell from '../components/AppShell';
import TicketCard from '../components/TicketCard';
import TicketDetailPanel from '../components/TicketDetailPanel';
import SplitPane from '../components/SplitPane';
import StatCard from '../components/StatCard';
import SlaConfigPanel from '../components/SlaConfigPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import TriageQueue from '../components/TriageQueue';
import { CircleDot, Clock, CheckCircle2, Trash2 } from 'lucide-react';

const ADMIN_TABS = [
  { id: 'overview',  label: 'Overview'      },
  { id: 'sla',       label: 'SLA Rules'     },
  { id: 'analytics', label: 'Analytics'     },
  { id: 'triage',    label: 'Triage Queue'  },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab]       = useState('overview');
  const [maximized, setMaximized]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteAllTickets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setSearchParams({});
      setConfirmDelete(false);
    },
  });

  const selectedId = searchParams.get('ticket');
  const selectTicket = (t) => { setMaximized(false); setSearchParams({ ticket: t.id }); };
  const closePanel   = ()  => { setMaximized(false); setSearchParams({}); };

  const { data: tickets = [], isLoading } = useTickets();

  const openCount       = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount   = tickets.filter(t => t.status === 'RESOLVED').length;

  /* ── Overview ticket list ── */
  const ticketList = (
    <div className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden">
      {isLoading ? (
        <p className="text-sm text-[#45464d] p-5">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-[#45464d] p-5">No tickets.</p>
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
    <div className="space-y-5">
      {/* Stat cards + debug action row */}
      <div className="flex items-stretch gap-0 border border-[#c6c6cd] bg-white rounded-none overflow-hidden">
        <StatCard label="Open Tickets"  count={openCount}       icon={CircleDot}    />
        <StatCard label="In Progress"   count={inProgressCount} icon={Clock}        accent="amber" />
        <StatCard label="Resolved"      count={resolvedCount}   icon={CheckCircle2} accent="emerald" last />

        {/* DEBUG — Delete All Tickets */}
        <div style={{
          borderLeft: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 20px', gap: 8, flexShrink: 0,
        }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: '#fff1f2', border: '1px solid #fca5a5',
                borderRadius: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#dc2626',
                whiteSpace: 'nowrap',
              }}
              title="Debug: wipe all tickets from the database"
            >
              <Trash2 size={13} />
              Delete All Tickets
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Are you sure?
              </span>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '5px 10px', background: '#dc2626', border: 'none',
                  borderRadius: 6, cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  opacity: deleteMutation.isPending ? 0.6 : 1,
                }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '5px 10px', background: 'transparent',
                  border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#374151',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
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
      {/* Wireframe tab bar — flush horizontal pill tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#c6c6cd] pb-0">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-[13px] font-semibold rounded-t-sm transition-colors -mb-px',
              activeTab === tab.id
                ? 'bg-white border border-b-white border-[#c6c6cd] text-[#0b1c30]'
                : 'text-[#45464d] hover:text-[#0b1c30] hover:bg-[#f0f4ff] border border-transparent',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview'  && overviewContent}
      {activeTab === 'sla'       && <SlaConfigPanel />}
      {activeTab === 'analytics' && <AnalyticsPanel />}
      {activeTab === 'triage'    && <TriageQueue />}
    </AppShell>
  );
}
