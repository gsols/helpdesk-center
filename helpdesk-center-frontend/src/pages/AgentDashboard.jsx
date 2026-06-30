import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTickets } from '../api/ticketsApi';
import TicketCard from '../components/TicketCard';

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    getTickets().then(r => setTickets(r.data)).catch(() => {});
  }, []);

  const roleLabel = {
    it_hardware: 'IT Hardware',
    it_software: 'IT Software',
    hr:          'HR',
  }[user?.role] || user?.role;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{roleLabel} Queue</h1>
          <p style={{ color: '#57606a', fontSize: 13 }}>Welcome, {user?.fullName} · {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={logout} style={btnSecondary}>Logout</button>
      </div>

      {tickets.length === 0
        ? <p style={{ color: '#57606a', textAlign: 'center', marginTop: 40 }}>No tickets in your queue.</p>
        : tickets.map(t => <TicketCard key={t.id} ticket={t} />)
      }
    </div>
  );
}

const pageStyle   = { maxWidth: 760, margin: '0 auto', padding: '28px 16px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 };
const btnSecondary = { padding: '8px 16px', background: '#f1f5f9', color: '#1f2328', border: '1px solid #e5e7eb', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
