/**
 * RerouteModal — themed to match the application design system.
 */
import { useState } from 'react';
import { useRerouteTicket } from '../hooks/useTickets';
import { T, btnPrimary, btnSecondary } from '../styles/tokens';
import api from '../api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, X } from 'lucide-react';

function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });
}

export default function RerouteModal({ ticket, onClose }) {
  const { data: departments = [] } = useDepartments();
  const rerouteTicket = useRerouteTicket();
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [error, setError] = useState('');

  const handleReroute = async () => {
    if (!selectedDeptId) { setError('Please select a department.'); return; }
    try {
      await rerouteTicket.mutateAsync({ id: ticket.id, targetDepartmentId: Number(selectedDeptId) });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to reroute ticket');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#ffffff',
        border: `1px solid ${T.border}`,
        borderRadius: 0,
        width: '100%', maxWidth: 440,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, flexShrink: 0,
            }}>
              <ArrowLeftRight size={14} color="#ffffff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
              Re-Route Ticket
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: T.textMuted, padding: 4, display: 'flex', alignItems: 'center',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 20px 0' }}>

          {/* Ticket reference */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px',
            background: T.surface,
            border: `1px solid ${T.borderLight}`,
            marginBottom: 20,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              color: T.textMuted, background: '#e5eeff', padding: '1px 7px', borderRadius: 3,
              flexShrink: 0, marginTop: 1,
            }}>
              #{ticket.id}
            </span>
            <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, lineHeight: '18px' }}>
              <strong style={{ color: T.textPrimary, fontWeight: 600 }}>{ticket.title}</strong>
            </p>
          </div>

          <p style={{ margin: '-12px 0 20px', fontSize: 11, color: T.textMuted }}>
            This action will be logged for AI model improvement.
          </p>

          {/* Department selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: T.textSecondary,
              marginBottom: 6,
            }}>
              Target Department
            </label>
            <select
              value={selectedDeptId}
              onChange={e => { setSelectedDeptId(e.target.value); setError(''); }}
              style={{
                width: '100%', height: 36,
                padding: '0 10px',
                border: error && !selectedDeptId ? '1px solid #fca5a5' : `1px solid ${T.border}`,
                borderRadius: 6,
                fontSize: 13, color: T.textPrimary,
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <option value="">— Select department —</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {error && (
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#b91c1c' }}>{error}</p>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '14px 20px',
          borderTop: `1px solid ${T.border}`,
          background: T.surface,
        }}>
          <button
            onClick={onClose}
            style={{ ...btnSecondary, borderRadius: 6 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleReroute}
            disabled={rerouteTicket.isPending}
            style={{
              ...btnPrimary,
              borderRadius: 6,
              opacity: rerouteTicket.isPending ? 0.6 : 1,
              cursor: rerouteTicket.isPending ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!rerouteTicket.isPending) e.currentTarget.style.background = '#1e293b'; }}
            onMouseLeave={(e) => { if (!rerouteTicket.isPending) e.currentTarget.style.background = '#0f172a'; }}
          >
            <ArrowLeftRight size={13} />
            {rerouteTicket.isPending ? 'Rerouting…' : 'Confirm Re-Route'}
          </button>
        </div>

      </div>
    </div>
  );
}
