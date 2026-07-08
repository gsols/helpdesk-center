import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import TicketDetailPanel from '../components/TicketDetailPanel';
import { ArrowLeft } from 'lucide-react';
import { T } from '../styles/tokens';

export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  return (
    <AppShell title="Ticket Detail">
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, width: 'fit-content' }}
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </button>
      <TicketDetailPanel ticketId={id} />
    </AppShell>
  );
}
