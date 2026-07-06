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
    // Structural outer container — rounded-none (ADR-0006 §1)
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
      {/* Header — structural section, rounded-none */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-none">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
          Uncategorized Tickets ({tickets.length})
        </span>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">AI confidence &lt;60% — manual assignment required.</p>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
        {tickets.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 flex-wrap hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">#{t.id}</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{t.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{t.creator?.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Form field select — rounded-none per blueprint §3 */}
              <select
                value={selections[t.id] ?? ''}
                onChange={e => setSelections(prev => ({ ...prev, [t.id]: e.target.value }))}
                className="h-8 px-2 border border-neutral-300 dark:border-neutral-600 rounded-none text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Assign department —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {/* Action button — rounded per hybrid rule (ADR-0006 §2) */}
              <button
                onClick={() => handleAssign(t.id)}
                disabled={!selections[t.id] || rerouteTicket.isPending}
                className="flex items-center gap-1 h-8 px-3 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40 transition-colors"
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
