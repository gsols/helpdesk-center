import { useState } from 'react';
import { useSlaRules, useUpsertSlaRule } from '../hooks/useSlaRules';
import { Save } from 'lucide-react';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_COLORS = {
  LOW: 'text-green-700 bg-green-50 border-green-200',
  MEDIUM: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
  CRITICAL: 'text-red-700 bg-red-50 border-red-200',
};

function groupRulesByDept(rules) {
  const map = {};
  rules.forEach(r => {
    const deptId = r.department?.id;
    if (!map[deptId]) map[deptId] = { dept: r.department, rules: {} };
    map[deptId].rules[r.priority] = r;
  });
  return Object.values(map);
}

export default function SlaConfigPanel() {
  const { data: rules = [], isLoading } = useSlaRules();
  const upsert = useUpsertSlaRule();

  // Local edits keyed by ruleId or "deptId-priority" for new rules
  const [edits, setEdits] = useState({});
  const [saved, setSaved] = useState({});

  const groups = groupRulesByDept(rules);

  const setEdit = (ruleId, hours) => {
    setEdits(prev => ({ ...prev, [ruleId]: hours }));
  };

  const handleSave = async (rule) => {
    const hours = edits[rule.id];
    if (hours == null) return;
    try {
      await upsert.mutateAsync({ id: rule.id, targetResolutionHours: Number(hours) });
      setSaved(prev => ({ ...prev, [rule.id]: true }));
      setEdits(prev => { const n = { ...prev }; delete n[rule.id]; return n; });
      setTimeout(() => setSaved(prev => { const n = { ...prev }; delete n[rule.id]; return n; }), 2000);
    } catch {
      alert('Failed to save SLA rule');
    }
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading SLA rules…</p>;
  if (groups.length === 0) return (
    <p className="text-sm text-gray-400">No SLA rules configured. Use the API to create initial rules per department.</p>
  );

  return (
    <div className="space-y-5">
      {groups.map(({ dept, rules: deptRules }) => (
        // Structural group container — rounded-none (ADR-0006 §1)
        <div key={dept?.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
          {/* Section header — structural, rounded-none */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-none">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
              {dept?.name ?? 'Unknown Department'}
            </span>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                {/* Jira-style table header typography */}
                <tr className="text-left border-b border-neutral-100 dark:border-neutral-800/60">
                  <th className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider pb-2 w-28">Priority</th>
                  <th className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider pb-2">Target Resolution (hours)</th>
                  <th className="pb-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {PRIORITIES.map(p => {
                  const rule = deptRules[p];
                  if (!rule) return null;
                  const currentValue = edits[rule.id] ?? rule.targetResolutionHours;
                  const isDirty = edits[rule.id] != null && Number(edits[rule.id]) !== rule.targetResolutionHours;
                  return (
                    <tr key={p} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="py-2 pr-4">
                        {/* Priority badge — interactive micro-widget, keeps rounded (ADR-0006 §2) */}
                        <span className={`text-xs font-semibold border rounded px-1.5 py-0.5 ${PRIORITY_COLORS[p]}`}>{p}</span>
                      </td>
                      <td className="py-2 pr-4">
                        {/* Form field input — rounded-none per blueprint §3 */}
                        <input
                          type="number"
                          min="1"
                          value={currentValue}
                          onChange={e => setEdit(rule.id, e.target.value)}
                          className="w-24 h-8 px-2 border border-neutral-300 dark:border-neutral-600 rounded-none text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2">
                        {isDirty && (
                          // Action button — rounded per hybrid rule (ADR-0006 §2)
                          <button
                            onClick={() => handleSave(rule)}
                            disabled={upsert.isPending}
                            className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 rounded px-2 py-1 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            <Save size={11} />
                            {saved[rule.id] ? '✓' : 'Save'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
