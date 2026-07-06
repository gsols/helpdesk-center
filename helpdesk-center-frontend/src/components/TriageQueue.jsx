import { useTriageQueue, useRerouteTicket } from '../hooks/useTickets';
import api from '../api/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/api/departments').then(r => r.data),
  });
}

export default function TriageQueue() {
  const { data: tickets = [], isLoading } = useTriageQueue();
  const { data: departments = [] } = useDepartments();
  const rerouteTicket = useRerouteTicket();
  const [selections, setSelections] = useState({});

  const handleAssign = async (ticketId) => {
    const deptId = selections[ticketId];
    if (!deptId) return;
    try {
      await rerouteTicket.mutateAsync({ id: ticketId, targetDepartmentId: Number(deptId) });
      setSelections(prev => { const n = { ...prev }; delete n[ticketId]; return n; });
    } catch {
      alert('Failed to assign ticket');
    }
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading triage queue…</p>;
  if (tickets.length === 0) return <p className="text-sm text-gray-400">Triage queue is empty.</p>;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-amber-50">
        <h3 className="text-sm font-semibold text-amber-800">
          Uncategorized Tickets ({tickets.length})
        </h3>
        <p className="text-xs text-amber-600 mt-0.5">These tickets had AI confidence below 60% and require manual assignment.</p>
      </div>
      <div className="divide-y divide-gray-100">
        {tickets.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-mono">#{t.id}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{t.title}</p>
              <p className="text-xs text-gray-500 truncate">{t.creator?.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selections[t.id] ?? ''}
                onChange={e => setSelections(prev => ({ ...prev, [t.id]: e.target.value }))}
                className="h-8 px-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">— Assign department —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={() => handleAssign(t.id)}
                disabled={!selections[t.id] || rerouteTicket.isPending}
                className="flex items-center gap-1 h-8 px-3 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40"
              >
                <ArrowRight size={12} /> Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
