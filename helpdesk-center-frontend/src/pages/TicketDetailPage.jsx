import { useState } from 'react';
import { useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import TicketDetailPanel from '../components/TicketDetailPanel';
import MyTicketsSidebar from '../components/MyTicketsSidebar';
import { ChevronRight } from 'lucide-react';

const TICKET_LIST_KEY = 'hd_ticket_list_collapsed';

export default function TicketDetailPage() {
  const { id } = useParams();

  const [listCollapsed, setListCollapsed] = useState(
    () => localStorage.getItem(TICKET_LIST_KEY) === 'true'
  );

  const handleToggle = () => {
    const next = !listCollapsed;
    setListCollapsed(next);
    localStorage.setItem(TICKET_LIST_KEY, String(next));
  };

  return (
    <AppShell title="Ticket Details" noPadding>
      <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>

        {/* Re-open tab when collapsed */}
        {listCollapsed && (
          <button
            onClick={handleToggle}
            title="Expand ticket list"
            style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              zIndex: 10, background: '#0b1c30', border: 'none',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              padding: '8px 4px', borderRadius: '0 4px 4px 0',
              display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <ChevronRight size={14} />
          </button>
        )}

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
