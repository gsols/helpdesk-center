/**
 * AgentDashboard — exact structural mirror of TicketDetailPage.
 *
 * Layout: AppShell (noPadding) → AgentQueueSidebar (collapsible, drag-resize)
 *         + TicketDetailPanel (fluid center + right metadata sidebar)
 *
 * The only difference from the employee TicketDetailPage is that the left
 * sidebar shows the agent's queue (My Queue / Dept Pool / Archive) instead
 * of "My Tickets". Everything else — the header, conversation thread,
 * comment section, attachments, SLA bar, metadata panel — is identical.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import AgentQueueSidebar from '../components/AgentQueueSidebar';
import TicketDetailPanel from '../components/TicketDetailPanel';
import { useMyQueue } from '../hooks/useTickets';

const LIST_MIN     = 200;
const LIST_MAX     = 500;
const LIST_DEFAULT = 280;

export default function AgentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: myQueue = [] } = useMyQueue();
  const [listCollapsed, setListCollapsed] = useState(false);
  const [listWidth,     setListWidth]     = useState(LIST_DEFAULT);
  const dragStartX = useRef(null);
  const dragStartW = useRef(null);

  const handleToggle = useCallback(() => {
    setListCollapsed(prev => !prev);
  }, []);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = listWidth;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const delta = ev.clientX - dragStartX.current;
      setListWidth(Math.min(LIST_MAX, Math.max(LIST_MIN, dragStartW.current + delta)));
    };
    const onUp = () => {
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, [listWidth]);

  // Same "tickets-tab-click" toggle event the employee page uses
  useEffect(() => {
    window.addEventListener('tickets-tab-click', handleToggle);
    return () => window.removeEventListener('tickets-tab-click', handleToggle);
  }, [handleToggle]);

  // Auto-select the first ticket in My Queue when no ticket is open
  useEffect(() => {
    if (!id && myQueue.length > 0) {
      navigate(`/agent/${myQueue[0].id}`, { replace: true });
    }
  }, [id, myQueue, navigate]);

  return (
    <AppShell title="Agent Workspace" noPadding panelToggle={handleToggle} panelCollapsed={listCollapsed}>
      <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>

        <AgentQueueSidebar
          activeTicketId={id}
          collapsed={listCollapsed}
          onToggle={handleToggle}
          width={listWidth}
          onDragHandleMouseDown={handleDragStart}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#fff' }}>
          {id ? (
            <TicketDetailPanel ticketId={id} />
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
              color: '#94a3b8', fontSize: 13,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Select a ticket from the queue to begin
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
