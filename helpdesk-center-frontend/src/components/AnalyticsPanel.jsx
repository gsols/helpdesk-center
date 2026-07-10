/**
 * AnalyticsPanel — wireframe: admin_analytics_ai_tuning_support_engine
 *
 * Layout:
 *   1. Executive Operational Metric Matrix (FRT · MTTR · AI Accuracy gauge)
 *   2. Asymmetric grid  — 8/12 left (Heatmap + Retrospective table) · 4/12 right (System Integrity + Alerts)
 *   3. IBM watsonx.ai Model Optimization dock
 */
import { useState, useEffect, useRef } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: 'TCK-1001', subject: 'Unable to login to account',        status: 'OPEN',             agent: 'Sarah Jenkins',   channel: 'Email',     priority: 'HIGH'     },
  { id: 'TCK-1002', subject: 'Payment confirmation not received', status: 'IN_PROGRESS',      agent: 'Alex Rivera',     channel: 'Chat',      priority: 'MEDIUM'   },
  { id: 'TCK-1003', subject: 'App crashes on startup',            status: 'OPEN',             agent: 'Daniel Park',     channel: 'Phone',     priority: 'HIGH'     },
  { id: 'TCK-1004', subject: 'Feature request for dark mode',     status: 'PENDING_EMPLOYEE', agent: 'Fatima Al Zahra', channel: 'Email',     priority: 'LOW'      },
  { id: 'TCK-1005', subject: 'Incorrect billing amount',          status: 'RESOLVED',         agent: 'Lucas Fernandez', channel: 'Web Form',  priority: 'HIGH'     },
  { id: 'TCK-1006', subject: 'Password reset not working',        status: 'OPEN',             agent: 'Anita Wijaya',    channel: 'Live Chat', priority: 'LOW'      },
  { id: 'TCK-1007', subject: 'Order status not updating',         status: 'IN_PROGRESS',      agent: 'Rizky Pratama',   channel: 'Phone',     priority: 'MEDIUM'   },
  { id: 'TCK-1008', subject: 'Cannot upload profile picture',     status: 'OPEN',             agent: 'Jin-Ho Kwon',     channel: 'Web Form',  priority: 'CRITICAL' },
  { id: 'TCK-1009', subject: 'Slow system performance reported',  status: 'IN_PROGRESS',      agent: 'Maya Santos',     channel: 'Email',     priority: 'HIGH'     },
  { id: 'TCK-1010', subject: 'Export to CSV returns empty file',  status: 'PENDING_EMPLOYEE', agent: 'Eitan Goldberg',  channel: 'Chat',      priority: 'MEDIUM'   },
];

const PRIORITY_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Heatmap data: 4 time-bands × 7 days — tailwind bg class
const HEATMAP = [
  ['bg-slate-50', 'bg-slate-100', 'bg-slate-200', 'bg-slate-300', 'bg-slate-100', 'bg-slate-50',  'bg-slate-100'],
  ['bg-slate-100', 'bg-slate-400', 'bg-slate-600', 'bg-slate-900', 'bg-slate-400', 'bg-slate-100', 'bg-slate-100'],
  ['bg-slate-200', 'bg-slate-600', 'bg-slate-900', 'bg-slate-900', 'bg-slate-600', 'bg-slate-200', 'bg-slate-100'],
  ['bg-slate-100', 'bg-slate-300', 'bg-slate-400', 'bg-slate-300', 'bg-slate-100', 'bg-slate-100', 'bg-slate-50'],
];

const RETRO_ROWS = [
  { category: 'Account & Authentication',  volume: '2,412', rate: 94, color: 'bg-emerald-500' },
  { category: 'API Connectivity Issues',   volume: '1,894', rate: 78, color: 'bg-amber-500'   },
  { category: 'Billing Discrepancies',     volume: '942',   rate: 89, color: 'bg-emerald-500' },
];

// ── Priority filter dropdown ───────────────────────────────────────────────────
const FILTER_DOT = {
  LOW:      'bg-emerald-500',
  MEDIUM:   'bg-amber-500',
  HIGH:     'bg-red-400',
  CRITICAL: 'bg-red-700',
};

function PriorityFilterDropdown({ selected, onToggle, onClear, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function cb(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', cb);
    return () => document.removeEventListener('mousedown', cb);
  }, [onClose]);

  const count = PRIORITY_TIERS.filter(t => selected[t]).length;
  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 w-52 z-50 bg-white border border-[#c6c6cd] shadow-md" style={{ borderRadius: 2 }}>
      <div className="px-3 py-2 border-b border-[#e5eeff] flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest">Filter by Priority</span>
        {count < PRIORITY_TIERS.length && (
          <button onClick={() => PRIORITY_TIERS.forEach(t => !selected[t] && onToggle(t))}
            className="text-[10px] text-blue-600 hover:underline font-semibold">Select all</button>
        )}
      </div>
      <div className="p-1.5">
        {PRIORITY_TIERS.map(tier => (
          <label key={tier} className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-[#f8f9ff] transition-colors" style={{ borderRadius: 2 }}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${FILTER_DOT[tier]}`} />
              <span className="text-xs font-medium text-[#0b1c30] capitalize">{tier.charAt(0) + tier.slice(1).toLowerCase()}</span>
            </div>
            <input type="checkbox" checked={!!selected[tier]} onChange={() => onToggle(tier)}
              className="h-3.5 w-3.5 rounded border-[#c6c6cd] accent-slate-900 cursor-pointer" />
          </label>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-[#e5eeff]">
        <button onClick={onClear} className="text-[11px] text-[#45464d] hover:text-[#0b1c30] font-medium">Clear selection</button>
      </div>
    </div>
  );
}

// ── AI Gauge SVG ───────────────────────────────────────────────────────────────
function AiGauge({ pct = 0.874 }) {
  const r = 20;
  const circ = 2 * Math.PI * r; // ≈ 125.6
  const offset = circ * (1 - pct);
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 44 44" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e0e3e5" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke="#0b1c30" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#0b1c30]" fill="currentColor">
          <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
        </svg>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPanel() {
  const [searchQuery,          setSearchQuery]          = useState('');
  const [heatmapRange,         setHeatmapRange]         = useState('7');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedPriorities,   setSelectedPriorities]   = useState(
    Object.fromEntries(PRIORITY_TIERS.map(t => [t, true]))
  );

  const togglePriority = (tier) => setSelectedPriorities(p => ({ ...p, [tier]: !p[tier] }));
  const clearSelection = ()     => setSelectedPriorities(Object.fromEntries(PRIORITY_TIERS.map(t => [t, false])));

  const filteredTickets = MOCK_TICKETS.filter(ticket => {
    if (!selectedPriorities[ticket.priority]) return false;
    const q = searchQuery.toLowerCase().trim();
    return !q || ticket.id.toLowerCase().includes(q) || ticket.subject.toLowerCase().includes(q) || ticket.agent.toLowerCase().includes(q);
  });

  const activeFilterCount = PRIORITY_TIERS.filter(t => selectedPriorities[t]).length;
  const isFiltered = activeFilterCount < PRIORITY_TIERS.length;

  return (
    <div className="space-y-6">

      {/* ── 1. Executive Operational Metric Matrix ──────────────────────── */}
      <section className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#c6c6cd]">

        {/* FRT */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-[#45464d] uppercase mb-1">Avg First Response Time (FRT)</p>
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-[24px] font-bold leading-8 tracking-tight text-[#0b1c30]">1.2 hrs</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 rounded-md border border-emerald-200">
                ↓ −15% vs Last Week
              </span>
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-500 w-[75%]" />
          </div>
        </div>

        {/* MTTR */}
        <div className="flex-1 p-6">
          <p className="text-[11px] font-bold tracking-widest text-[#45464d] uppercase mb-1">Mean Time to Resolution (MTTR)</p>
          <div className="flex items-baseline gap-3 mt-1.5">
            <span className="text-[24px] font-bold leading-8 tracking-tight text-[#0b1c30]">4.6 hrs</span>
          </div>
          <div className="mt-6 flex gap-1">
            {['bg-slate-900','bg-slate-900','bg-slate-900/50','bg-slate-200','bg-slate-100','bg-slate-100'].map((c,i) => (
              <div key={i} className={`h-4 flex-1 ${c}`} />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-[#45464d]">Efficiency Trend: <span className="text-[#0b1c30] font-semibold">Stable</span></p>
        </div>

        {/* AI Accuracy gauge */}
        <div className="flex-1 p-6 flex items-center gap-6">
          <div className="flex-grow">
            <p className="text-[11px] font-bold tracking-widest text-[#45464d] uppercase mb-1">AI Routing Accuracy</p>
            <span className="text-[24px] font-bold leading-8 tracking-tight text-[#0b1c30]">87.4%</span>
            <p className="text-[13px] text-[#45464d] mt-1">Goal: 92.0% <span className="text-amber-600 font-semibold">(+4.6% target)</span></p>
          </div>
          <AiGauge pct={0.874} />
        </div>
      </section>

      {/* ── 2. Asymmetric grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6 items-start">

        {/* Left: Heatmap + Retrospective table */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Ticket Volume Heatmap */}
          <div className="bg-white border border-[#c6c6cd] rounded-none p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[14px] font-bold text-[#0b1c30]">Ticket Volume Heatmap</h3>
              <div className="flex gap-2">
                {['7','30'].map(d => (
                  <button key={d}
                    onClick={() => setHeatmapRange(d)}
                    className={[
                      'px-3 py-1 border text-[13px] transition-colors',
                      heatmapRange === d
                        ? 'bg-[#0b1c30] border-[#0b1c30] text-white'
                        : 'border-[#c6c6cd] bg-[#f8f9ff] text-[#45464d] hover:bg-[#e5eeff]',
                    ].join(' ')}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 w-full flex flex-col gap-1">
              {HEATMAP.map((row, ri) => (
                <div key={ri} className="flex-1 flex gap-1">
                  {row.map((cls, ci) => <div key={ci} className={`flex-1 ${cls}`} />)}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <span key={d} className="text-[10px] font-bold text-[#45464d] uppercase tracking-wider">{d}</span>
              ))}
            </div>
          </div>

          {/* Retrospective Analysis Table */}
          <div className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9ff] border-b border-[#c6c6cd]">
                  <th className="px-4 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Top Routing Categories</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Volume</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Success Rate</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#45464d] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                {RETRO_ROWS.map(row => (
                  <tr key={row.category} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="px-4 py-3 text-[14px] font-semibold text-[#0b1c30]">{row.category}</td>
                    <td className="px-4 py-3 text-[14px] text-[#0b1c30]">{row.volume}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-slate-100 overflow-hidden">
                          <div className={`${row.color} h-full`} style={{ width: `${row.rate}%` }} />
                        </div>
                        <span className="font-mono text-[13px] font-medium text-[#0b1c30]">{row.rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-[#45464d] hover:text-[#0b1c30]">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Filter + live ticket table ── */}
          <div className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden">
            {/* Control bar */}
            <div className="px-4 py-3 flex flex-wrap gap-2 items-center bg-[#f8f9ff] border-b border-[#c6c6cd]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, agent, subject…"
                className="flex-1 min-w-[220px] h-8 px-3 text-[13px] bg-white border border-[#c6c6cd] text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                style={{ borderRadius: 0 }}
              />
              <div className="relative">
                <button
                  onClick={() => setShowPriorityDropdown(v => !v)}
                  className={[
                    'h-8 px-3 text-xs font-semibold flex items-center gap-1.5 border transition-colors',
                    showPriorityDropdown || isFiltered
                      ? 'bg-[#e5eeff] border-[#7c839b] text-[#0b1c30]'
                      : 'bg-white border-[#c6c6cd] text-[#45464d] hover:bg-[#f0f4ff]',
                  ].join(' ')}
                  style={{ borderRadius: 0 }}
                >
                  <span>Priority</span>
                  {isFiltered && (
                    <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-[#131b2e] text-white rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                  <svg className={`w-3 h-3 text-[#45464d] transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`}
                    viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showPriorityDropdown && (
                  <PriorityFilterDropdown
                    selected={selectedPriorities}
                    onToggle={togglePriority}
                    onClear={clearSelection}
                    onClose={() => setShowPriorityDropdown(false)}
                  />
                )}
              </div>
              {isFiltered && (
                <span className="text-[11px] text-[#45464d]">
                  Showing {filteredTickets.length} of {MOCK_TICKETS.length} tickets
                </span>
              )}
            </div>

            {/* Ticket table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[820px]">
                <thead>
                  <tr className="border-b border-[#c6c6cd] bg-[#f8f9ff]">
                    <th className="w-28 px-4 py-2.5 text-[11px] font-bold text-[#45464d] uppercase tracking-widest pl-5">Ticket ID</th>
                    <th className="px-4 py-2.5 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Subject</th>
                    <th className="w-40 px-4 py-2.5 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Status</th>
                    <th className="w-44 px-4 py-2.5 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Assigned Agent</th>
                    <th className="w-28 px-4 py-2.5 text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Channel</th>
                    <th className="w-32 px-4 py-2.5 pr-5 text-[11px] font-bold text-[#45464d] uppercase tracking-widest text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eeff] text-[13px]">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[#45464d]">
                        No tickets match the current filters.
                      </td>
                    </tr>
                  ) : filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="cursor-pointer group hover:bg-[#f8f9ff] transition-colors">
                      <td className="px-4 py-3 pl-5 font-mono text-[12px] font-semibold text-blue-600 group-hover:underline">
                        {ticket.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0b1c30] truncate max-w-0">
                        <span className="block truncate" title={ticket.subject}>{ticket.subject}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3 text-[#45464d] font-medium truncate">{ticket.agent}</td>
                      <td className="px-4 py-3 text-[#45464d] text-xs">{ticket.channel}</td>
                      <td className="px-4 py-3 pr-5 text-right"><PriorityBadge priority={ticket.priority} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-2 border-t border-[#e5eeff] bg-[#f8f9ff]">
              <span className="text-[11px] text-[#45464d]">
                {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                {isFiltered ? ` (filtered from ${MOCK_TICKETS.length})` : ' total'}
              </span>
            </div>
          </div>
        </div>

        {/* Right sidebar: System Integrity + Alerts */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* System Integrity dark card */}
          <div className="bg-slate-900 text-white p-6 rounded-none space-y-4">
            <h3 className="text-[14px] font-bold">System Integrity</h3>
            <div className="space-y-3">
              {[
                { label: 'Model Node A',  status: 'Operational', color: 'bg-emerald-400 text-emerald-400', pulse: false },
                { label: 'Model Node B',  status: 'Operational', color: 'bg-emerald-400 text-emerald-400', pulse: false },
                { label: 'Training Queue',status: 'High Latency', color: 'bg-amber-400 text-amber-400',   pulse: true  },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-[13px]">
                  <span className="opacity-70">{item.label}</span>
                  <span className={`font-bold flex items-center gap-1 ${item.color.split(' ')[1]}`}>
                    <span className={`w-2 h-2 rounded-full ${item.color.split(' ')[0]} ${item.pulse ? 'animate-pulse' : ''}`} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Global Uptime</span>
                <span className="text-[10px] font-bold">99.98%</span>
              </div>
              <div className="h-1 w-full bg-slate-800">
                <div className="h-full bg-blue-500 w-[99.98%]" />
              </div>
            </div>
          </div>

          {/* Recent Critical Events */}
          <div className="bg-white border border-[#c6c6cd] rounded-none p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest">Recent Critical Events</h4>
              <span className="bg-red-50 text-red-700 px-1.5 py-0.5 text-[9px] font-bold uppercase border border-red-200 rounded-md">2 Unread</span>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-[#0b1c30]">SLA Breach Detected — API Tier</p>
                  <p className="font-mono text-[13px] text-[#45464d]">Response latency exceeded 500ms threshold.</p>
                  <p className="text-[10px] text-[#45464d] opacity-60">14 mins ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-[#0b1c30]">Retraining Scheduled</p>
                  <p className="font-mono text-[13px] text-[#45464d]">Automated model optimization begins 00:00 UTC.</p>
                  <p className="text-[10px] text-[#45464d] opacity-60">2 hrs ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. IBM watsonx.ai Model Optimization Dock ─────────────────── */}
      <section className="bg-white border border-[#c6c6cd] rounded-none overflow-hidden">
        <header className="bg-slate-100 px-6 py-3 border-b border-[#c6c6cd] flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* CPU icon */}
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-[#0b1c30]">
              <rect x="5" y="5" width="10" height="10" rx="0.5" />
              <path d="M7 1v4M13 1v4M7 15v4M13 15v4M1 7h4M1 13h4M15 7h4M15 13h4" />
            </svg>
            <h2 className="text-[13px] font-bold text-[#0b1c30] uppercase tracking-tight">IBM watsonx.ai Model Optimization</h2>
          </div>
          <span className="font-mono text-[13px] bg-white border border-[#c6c6cd] px-3 py-1 text-[#45464d]">PIPELINE_STABLE_V2</span>
        </header>
        <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-grow">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest opacity-60">Active Model Pipeline</p>
              <p className="text-[14px] font-bold text-[#0b1c30]">watsonx.ai Classify v2.1</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-emerald-600 font-bold uppercase">Live Production</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest opacity-60">Pending Corrected Logs</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[14px] font-bold text-[#0b1c30]">142 samples</p>
                <span className="text-[10px] text-[#45464d]">(Ready for retraining)</span>
              </div>
              <p className="text-[11px] text-[#45464d] mt-2 italic">Threshold for optimal retraining: 150 samples</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#45464d] uppercase tracking-widest opacity-60">Last Optimization Executed</p>
              <p className="text-[14px] font-bold text-[#0b1c30]">14 days ago</p>
              <p className="text-[11px] text-[#45464d] mt-2">Next scheduled: <span className="font-bold">In 16 days</span></p>
            </div>
          </div>
          <div className="shrink-0">
            <button className="bg-slate-900 text-white px-6 py-3 font-bold text-[14px] flex items-center gap-2 hover:bg-black transition-all active:scale-95 rounded-none">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Zm.75 4.75a.75.75 0 0 0-1.5 0v4.69L7.22 9.47a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.06 0l2.75-2.75a.75.75 0 1 0-1.06-1.06l-1.91 1.97V6.75Z" />
              </svg>
              Compile Dataset &amp; Optimize Model
            </button>
          </div>
        </div>
        <div className="bg-[#f8f9ff] px-6 py-2 border-t border-[#c6c6cd] flex gap-4">
          <span className="text-[10px] text-[#45464d] uppercase font-bold flex items-center gap-1">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm-.75-9.75a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Zm.75 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
            Auto-Optimization: On
          </span>
          <span className="text-[10px] text-[#45464d] uppercase font-bold flex items-center gap-1">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2V4.5A3.5 3.5 0 0 0 8 1Zm0 1.5A2 2 0 0 1 10 4.5V6H6V4.5A2 2 0 0 1 8 2.5Z" clipRule="evenodd" /></svg>
            Encryption: AES-256
          </span>
        </div>
      </section>

    </div>
  );
}
