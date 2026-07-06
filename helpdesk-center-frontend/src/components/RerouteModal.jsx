import { useState } from 'react';
import { useRerouteTicket } from '../hooks/useTickets';
import api from '../api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });
}

/**
 * Props:
 *   ticket  — the ticket being rerouted
 *   onClose — () => void
 */
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
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Re-Route Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4">
            Select the correct department for <strong className="text-gray-800">#{ticket.id}: {ticket.title}</strong>.
            This action will be logged for AI model improvement.
          </p>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Department</label>
          <select
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
            className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">— Select department —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onClose}
              className="h-9 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleReroute}
              disabled={rerouteTicket.isPending}
              className="h-9 px-4 text-sm font-semibold text-white bg-orange-600 rounded-md disabled:opacity-50 hover:bg-orange-700">
              {rerouteTicket.isPending ? 'Rerouting…' : 'Confirm Re-Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
