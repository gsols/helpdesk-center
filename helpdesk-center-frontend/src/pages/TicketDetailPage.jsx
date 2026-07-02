import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import TicketDetailPanel from '../components/TicketDetailPanel';
import { ArrowLeft } from 'lucide-react';

export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <AppHeader user={user} onLogout={() => navigate('/login')} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82d4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <TicketDetailPanel ticketId={id} />
      </main>
    </div>
  );
}
