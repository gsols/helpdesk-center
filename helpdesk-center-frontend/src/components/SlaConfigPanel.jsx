/**
 * SlaConfigPanel — wireframe: admin_sla_policy_integrations_support_engine
 *
 * Sections:
 *   1. Dynamic SLA Deadline Parameters — colored-dot priority table with number inputs + Update buttons
 *   2. Third-Party Messaging Rails — Company name + Slack webhook inputs
 *   3. Summary stat widgets — Active Configs · Success Rate · Pending Sync
 */
import { useState } from 'react';
import { useSlaRules, useUpsertSlaRule } from '../hooks/useSlaRules';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Wireframe priority descriptions
const PRIORITY_META = {
  LOW:      { dot: 'bg-emerald-500',          pulse: false, description: 'General advice and non-blocking requests.'         },
  MEDIUM:   { dot: 'bg-blue-500',             pulse: false, description: 'Standard operational bugs impacting daily work.'   },
  HIGH:     { dot: 'bg-amber-500',            pulse: false, description: 'Severe workflow restrictions or portal blockages.' },
  CRITICAL: { dot: 'bg-red-600 animate-pulse',pulse: true,  description: 'Company-wide system outages or data line leaks.'  },
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

  const [edits, setEdits] = useState({});
  const [saved,  setSaved]  = useState({});

  // Messaging rails state
  const [company,  setCompany]  = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [railSaved, setRailSaved] = useState(false);

  const groups = groupRulesByDept(rules);

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

  const handleSaveRails = (e) => {
    e.preventDefault();
    setRailSaved(true);
    setTimeout(() => setRailSaved(false), 2500);
  };

  if (isLoading) return <p className="text-sm text-[#45464d]">Loading SLA rules…</p>;

  // Use first group or a placeholder when no backend data yet
  const displayGroups = groups.length > 0 ? groups : [{ dept: { id: 0, name: 'Default' }, rules: {} }];

  return (
    <div className="space-y-6">

      {/* ── Section 1: Dynamic SLA Deadline Parameters ── */}
      {displayGroups.map(({ dept, rules: deptRules }) => (
        <section key={dept?.id} className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden">
          <div className="p-6 border-b border-[#c6c6cd] bg-white">
            <h2 className="text-[18px] font-bold text-[#0b1c30]">Dynamic SLA Deadline Parameters</h2>
            <p className="text-[13px] text-[#45464d] mt-1">
              Configure the absolute target resolution hours mapped per ticket impact tier
              {dept?.name ? ` — ${dept.name}` : ''}.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] border-b border-[#c6c6cd]">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Priority Tier</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Description</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest w-32 text-center">Deadline (Hrs)</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest w-32 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]/60">
                {PRIORITIES.map(p => {
                  const rule = deptRules[p];
                  const currentValue = rule ? (edits[rule.id] ?? rule.targetResolutionHours) : '';
                  const isDirty = rule && edits[rule.id] != null && Number(edits[rule.id]) !== rule.targetResolutionHours;
                  const meta = PRIORITY_META[p];
                  return (
                    <tr key={p} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                          <span className="text-[14px] font-semibold text-[#0b1c30]">{p} Priority</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[#45464d]">{meta.description}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="1"
                          value={currentValue}
                          onChange={e => rule && setEdits(prev => ({ ...prev, [rule.id]: e.target.value }))}
                          className="w-20 h-8 text-center border border-[#c6c6cd] font-mono text-[13px] bg-white text-[#0b1c30] focus:outline-none focus:border-[#0b1c30] focus:ring-1 focus:ring-[#0b1c30] rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {rule && (
                          <button
                            onClick={() => isDirty ? handleSave(rule) : undefined}
                            disabled={upsert.isPending}
                            className={[
                              'text-[13px] font-semibold px-3 py-1 rounded-lg border transition-all',
                              saved[rule.id]
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'text-[#0b1c30] border-[#c6c6cd] hover:bg-[#e5eeff] disabled:opacity-50',
                            ].join(' ')}
                          >
                            {saved[rule.id] ? '✓ Updated' : 'Update'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* ── Section 2: Third-Party Messaging Rails ── */}
      <section className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden">
        <div className="p-6 border-b border-[#c6c6cd] bg-white">
          <h2 className="text-[18px] font-bold text-[#0b1c30]">Third-Party Messaging Rails</h2>
          <p className="text-[13px] text-[#45464d] mt-1">Configure external webhooks for asynchronous background notification routing.</p>
        </div>
        <form onSubmit={handleSaveRails}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest">
                Multi-Tenant Company Display Name
              </label>
              <div className="relative">
                <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6cd]">
                  <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 0 1 0-1.5h12.5a.75.75 0 0 1 0 1.5H16v13h.25a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1 0-1.5H4Z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] border border-[#c6c6cd] text-[14px] text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:border-[#0b1c30] focus:ring-1 focus:ring-[#0b1c30] rounded-lg"
                />
              </div>
            </div>
            {/* Slack webhook */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest">
                Incoming Corporate Slack Webhook URL
              </label>
              <div className="relative">
                <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6cd]">
                  <path fillRule="evenodd" d="M14.5 2A1.5 1.5 0 0 0 13 3.5v.75h-.75a1.5 1.5 0 0 0 0 3H13v.75a1.5 1.5 0 0 0 3 0V7.25h.75a1.5 1.5 0 0 0 0-3H16V3.5A1.5 1.5 0 0 0 14.5 2ZM8 4.75A3.75 3.75 0 0 0 4.25 8.5v3a3.75 3.75 0 0 0 7.5 0v-3A3.75 3.75 0 0 0 8 4.75Z" clipRule="evenodd" />
                </svg>
                <input
                  type="url"
                  value={slackUrl}
                  onChange={e => setSlackUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/…"
                  className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] border border-[#c6c6cd] font-mono text-[13px] text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:border-[#0b1c30] focus:ring-1 focus:ring-[#0b1c30] rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-6 bg-white border-t border-[#c6c6cd]">
            <div className="flex items-center gap-2 text-[#45464d]">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm-.75-9.75a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Zm.75 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <span className="text-[13px] italic">These settings affect all child tenants under the master account.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-slate-900 text-white font-semibold text-[14px] px-8 py-3 hover:bg-black transition-colors rounded-none flex items-center gap-2 active:scale-95 duration-75"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                </svg>
                Save Global Configurations
              </button>
              {railSaved && <span className="text-xs font-semibold text-emerald-600">✓ Saved</span>}
            </div>
          </div>
        </form>
      </section>

      {/* ── Section 3: Summary stat widgets ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Configs', value: '12',    icon: '⚙',  accent: '' },
          { label: 'Success Rate',   value: '99.8%', icon: '✓',  accent: 'text-emerald-600' },
          { label: 'Pending Sync',   value: '0',     icon: '⟳',  accent: '' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#e5eeff] border border-[#c6c6cd] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest">{stat.label}</p>
              <p className={`text-[24px] font-bold leading-8 tracking-tight text-[#0b1c30] ${stat.accent}`}>{stat.value}</p>
            </div>
            <span className="text-4xl opacity-20 text-[#0b1c30]">{stat.icon}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
