/**
 * TicketsIndexPage — /tickets index
 *
 * Auto-redirects to the first ticket (sorted by createdAt desc) so that
 * clicking the "Tickets" nav item always opens a ticket detail view.
 * If no tickets exist, renders the full layout with MyTicketsSidebar and
 * an empty state message.
 */
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import MyTicketsSidebar from '../components/MyTicketsSidebar';
import { useTickets } from '../hooks/useTickets';

export default function TicketsIndexPage() {
  const { data: tickets = [], isLoading } = useTickets();

  // Sort descending by createdAt so most recent is first
  const sorted = [...tickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Once loaded, if there's at least one ticket, redirect straight to it
  if (!isLoading && sorted.length > 0) {
    return <Navigate to={`/tickets/${sorted[0].id}`} replace />;
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell title="Tickets" noPadding>
        <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
          <MyTicketsSidebar activeTicketId={null} collapsed={false} onToggle={() => {}} />
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', color: '#94a3b8', fontSize: 13,
          }}>
            Loading tickets…
          </div>
        </div>
      </AppShell>
    );
  }

  // No tickets at all — empty state
  return (
    <AppShell title="Tickets" noPadding>
      <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
        <MyTicketsSidebar activeTicketId={null} collapsed={false} onToggle={() => {}} />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#fff', gap: 8,
        }}>
          <span style={{ fontSize: 32 }}>🎫</span>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0b1c30' }}>No tickets yet</div>
          <div style={{ fontSize: 13, color: '#76777d' }}>
            Submit a ticket from your dashboard to get started.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
