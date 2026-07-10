import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import TicketDetailPanel from '../components/TicketDetailPanel';
import MyTicketsSidebar from '../components/MyTicketsSidebar';

const LIST_MIN = 200;
const LIST_MAX = 500;
const LIST_DEFAULT = 280;

export default function TicketDetailPage() {
  const { id } = useParams();
  const [listCollapsed, setListCollapsed] = useState(false);
  const [listWidth, setListWidth] = useState(LIST_DEFAULT);
  const dragStartX = useRef(null);
  const dragStartW = useRef(null);

  const handleToggle = useCallback(() => {
    setListCollapsed(prev => !prev);
  }, []);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = listWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const delta = ev.clientX - dragStartX.current;
      setListWidth(Math.min(LIST_MAX, Math.max(LIST_MIN, dragStartW.current + delta)));
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [listWidth]);

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
          width={listWidth}
          onDragHandleMouseDown={handleDragStart}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#fff' }}>
          <TicketDetailPanel ticketId={id} />
        </div>
      </div>
    </AppShell>
  );
}
