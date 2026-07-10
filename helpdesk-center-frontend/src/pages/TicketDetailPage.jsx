import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import TicketDetailPanel from '../components/TicketDetailPanel';
import MyTicketsSidebar from '../components/MyTicketsSidebar';

export default function TicketDetailPage() {
  const { id } = useParams();

  // Always open when first arriving on this page
  const [listCollapsed, setListCollapsed] = useState(false);

  const handleToggle = useCallback(() => {
    setListCollapsed(prev => !prev);
  }, []);

  // AppShell fires this event when the Tickets nav item is clicked while already active
  useEffect(() => {
    window.addEventListener('tickets-tab-click', handleToggle);
    return () => window.removeEventListener('tickets-tab-click', handleToggle);
  }, [handleToggle]);

  return (
    <AppShell title="Ticket Details" noPadding>
      <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>

        <MyTicketsSidebar
          activeTicketId={id}
          collapsed={listCollapsed}
          onToggle={handleToggle}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#fff' }}>
          <TicketDetailPanel ticketId={id} />
        </div>
      </div>
    </AppShell>
  );
}
