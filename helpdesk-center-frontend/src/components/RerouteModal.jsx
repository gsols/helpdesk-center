/**
 * RerouteModal — wireframe style
 * Sharp-edged modal with wireframe color tokens.
 */
import { useState } from 'react';
import { useRerouteTicket } from '../hooks/useTickets';
import api from '../api/axiosInstance';
import { useQuery } from '@tanstack/react-query';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      {/* Modal container — sharp edges, wireframe border */}
      <div className="bg-white w-full max-w-md border border-[#c6c6cd]" style={{ borderRadius: 0 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#c6c6cd]">
          <h2 className="text-[14px] font-bold text-[#0b1c30]">Re-Route Ticket</h2>
          <button
            onClick={onClose}
            className="text-[#45464d] hover:text-[#0b1c30] transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-[13px] text-[#45464d] mb-4">
            Select the correct department for{' '}
            <strong className="text-[#0b1c30] font-semibold">
              #{ticket.id}: {ticket.title}
            </strong>.
            This action will be logged for AI model improvement.
          </p>

          <label className="block text-[11px] font-bold text-[#45464d] uppercase tracking-widest mb-1.5">
            Target Department
          </label>
          <select
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
            className="w-full h-9 px-3 border border-[#c6c6cd] text-[14px] bg-[#f8f9ff] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30] focus:ring-1 focus:ring-[#0b1c30]"
            style={{ borderRadius: 0 }}
          >
            <option value="">— Select department —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium text-[#45464d] bg-white border border-[#c6c6cd] hover:bg-[#f8f9ff] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Cancel
            </button>
            <button
              onClick={handleReroute}
              disabled={rerouteTicket.isPending}
              className="h-9 px-4 text-[13px] font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 transition-colors"
              style={{ borderRadius: 0 }}
            >
              {rerouteTicket.isPending ? 'Rerouting…' : 'Confirm Re-Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
