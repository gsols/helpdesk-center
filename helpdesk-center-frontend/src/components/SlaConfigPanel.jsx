/**
 * SlaConfigPanel — Admin SLA Rules tab
 *
 * Layout:
 *   Top    — page title + "Policy Active" pill
 *   Dept tabs (when > 1 department)
 *   Center — Dynamic SLA Deadline Parameters table
 *   Bottom — Notification Channels strip + stat bar
 */
import { useState } from 'react';
import { useSlaRules, useUpsertSlaRule, useDeleteSlaRule, useDepartments } from '../hooks/useSlaRules';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const P_META = {
  LOW:      { dot: '#22c55e', label: 'LOW Priority',      description: 'General advice and non-blocking requests.',          defaultHrs: 48 },
  MEDIUM:   { dot: '#3b82f6', label: 'MEDIUM Priority',   description: 'Standard operational bugs impacting daily work.',    defaultHrs: 24 },
  HIGH:     { dot: '#f59e0b', label: 'HIGH Priority',     description: 'Severe workflow restrictions or portal blockages.',  defaultHrs: 4  },
  CRITICAL: { dot: '#ef4444', label: 'CRITICAL Priority', description: 'Company-wide system outages or data line leaks.',    defaultHrs: 1  },
};

function groupRulesByDept(rules) {
  const map = {};
  rules.forEach(r => {
    const key = r.departmentId ?? 0;
    if (!map[key]) map[key] = { deptId: r.departmentId, deptName: r.departmentName, rules: {} };
    map[key].rules[r.priority] = r;
  });
  return Object.values(map);
}

/* ── Notification Channels strip ─────────────────────────────────────────── */
function NotificationStrip({ company, setCompany, slackUrl, setSlackUrl, railSaved, onSave }) {
  const [focusedCompany, setFocusedCompany] = useState(false);
  const [focusedSlack,   setFocusedSlack]   = useState(false);

  const fieldStyle = (focused) => ({
    width: '100%', height: 36, paddingLeft: 12, paddingRight: 12,
    background: '#f8fafc', border: `1px solid ${focused ? '#0b1c30' : '#e2e8f0'}`,
    borderRadius: 4, fontSize: 12, color: '#0b1c30', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 16 }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>Notification Channels</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>— Webhook &amp; messaging rails</div>
        {railSaved && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Saved
          </span>
        )}
      </div>
      <form onSubmit={onSave}>
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>Company Display Name</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corporation"
              onFocus={() => setFocusedCompany(true)} onBlur={() => setFocusedCompany(false)}
              style={fieldStyle(focusedCompany)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>Slack Webhook URL</label>
            <input type="url" value={slackUrl} onChange={e => setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/services/…"
              onFocus={() => setFocusedSlack(true)} onBlur={() => setFocusedSlack(false)}
              style={{ ...fieldStyle(focusedSlack), fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <button type="submit" style={{
            height: 36, padding: '0 18px', borderRadius: 4,
            background: '#0b1c30', color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function SlaConfigPanel() {
  const { data: rules = [], isLoading: rulesLoading } = useSlaRules();
  const { data: departments = [], isLoading: deptsLoading } = useDepartments();
  const upsert         = useUpsertSlaRule();
  const deleteMutation = useDeleteSlaRule();

  const [inputs,     setInputs]     = useState({});
  const [saved,      setSaved]      = useState({});
  const [activeDept, setActiveDept] = useState(null);
  const [company,    setCompany]    = useState('');
  const [slackUrl,   setSlackUrl]   = useState('');
  const [railSaved,  setRailSaved]  = useState(false);

  const isLoading = rulesLoading || deptsLoading;
  const isPending = upsert.isPending || deleteMutation.isPending;

  const ruleGroups = groupRulesByDept(rules);
  const displayGroups = (() => {
    if (ruleGroups.length > 0) {
      const covered = new Set(ruleGroups.map(g => g.deptId));
      const missing = departments.filter(d => !covered.has(d.id)).map(d => ({ deptId: d.id, deptName: d.name, rules: {} }));
      // Drop any group whose deptName is absent (e.g. rules with a NULL department_id)
      return [...ruleGroups, ...missing].filter(g => !!g.deptName);
    }
    if (departments.length > 0) return departments.map(d => ({ deptId: d.id, deptName: d.name, rules: {} }));
    return [{ deptId: 0, deptName: 'All Departments', rules: {} }];
  })();
  const activeGroup  = displayGroups.find(g => g.deptId === activeDept) ?? displayGroups[0];
  const activeRules  = Object.values(activeGroup.rules);
  const configuredCount = activeRules.filter(r => r.targetResolutionHours).length;
  const avgHrs = activeRules.length
    ? (activeRules.reduce((s, r) => s + (r.targetResolutionHours || 0), 0) / activeRules.length).toFixed(1)
    : '—';

  const handleUpdate = async (rule) => {
    const hrs = Number(inputs[rule.id] ?? rule.targetResolutionHours);
    if (!hrs || hrs < 1) return;
    try {
      await upsert.mutateAsync({ id: rule.id, targetResolutionHours: hrs });
      setInputs(prev => { const n = { ...prev }; delete n[rule.id]; return n; });
      setSaved(prev => ({ ...prev, [rule.id]: true }));
      setTimeout(() => setSaved(prev => { const n = { ...prev }; delete n[rule.id]; return n; }), 2000);
    } catch { alert('Failed to update SLA rule.'); }
  };

  const handleCreate = async (priority) => {
    const key = `new_${priority}`;
    const hrs = Number(inputs[key] ?? P_META[priority].defaultHrs);
    if (!hrs || hrs < 1) return;
    try {
      await upsert.mutateAsync({ departmentId: activeGroup.deptId, priority, targetResolutionHours: hrs });
      setInputs(prev => { const n = { ...prev }; delete n[key]; return n; });
    } catch { alert('Failed to create SLA rule.'); }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13, padding: 32 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
        <circle cx="8" cy="8" r="6" stroke="#e2e8f0" strokeWidth="2.5"/>
        <path d="M8 2a6 6 0 0 1 6 6" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      Loading SLA configuration…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0b1c30', letterSpacing: '-0.02em' }}>SLA Deadline Configuration</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Define resolution targets per priority tier and manage notification integrations.</div>
        </div>
        {configuredCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Policy Active</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', border: '1px solid #fde68a', background: '#fffbeb', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Not Configured</span>
          </div>
        )}
      </div>

      {/* ── Dept tabs ────────────────────────────────────────────────────── */}
      {displayGroups.length > 1 && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
          {displayGroups.map(g => {
            const isActive = g.deptId === (activeDept ?? displayGroups[0].deptId);
            return (
              <button key={g.deptId} onClick={() => setActiveDept(g.deptId)} style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
                borderBottom: isActive ? '2px solid #0b1c30' : '2px solid transparent',
                color: isActive ? '#0b1c30' : '#76777d',
                fontSize: 13, fontWeight: 600, marginBottom: -1, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#0b1c30'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#76777d'; }}
              >{g.deptName}</button>
            );
          })}
        </div>
      )}

      {/* ── SLA table card ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0b1c30', marginBottom: 3 }}>Dynamic SLA Deadline Parameters</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Configure the absolute target resolution hours mapped per ticket impact tier.</div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 130px 100px', padding: '9px 24px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          {[['PRIORITY TIER', 'left'], ['DESCRIPTION', 'left'], ['DEADLINE (HRS)', 'center'], ['ACTION', 'center']].map(([h, align]) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#64748b', textTransform: 'uppercase', textAlign: align }}>{h}</div>
          ))}
        </div>

        {/* Table rows */}
        {PRIORITIES.map((p, idx) => {
          const meta     = P_META[p];
          const rule     = activeGroup.rules[p];
          const hasRule  = !!rule;
          const inputKey = hasRule ? rule.id : `new_${p}`;
          const inputVal = inputs[inputKey] ?? String(hasRule ? rule.targetResolutionHours : meta.defaultHrs);
          const wasSaved = hasRule && saved[rule.id];

          return (
            <div key={p} style={{
              display: 'grid', gridTemplateColumns: '200px 1fr 130px 100px',
              padding: '16px 24px', alignItems: 'center',
              borderBottom: idx < PRIORITIES.length - 1 ? '1px solid #f1f5f9' : 'none',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: hasRule ? meta.dot : '#cbd5e1', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: hasRule ? '#0b1c30' : '#94a3b8' }}>{meta.label}</span>
              </div>

              <div style={{ fontSize: 13, color: '#64748b', paddingRight: 16 }}>{meta.description}</div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input type="number" min="1" value={inputVal}
                  onChange={e => setInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                  style={{ width: 76, height: 32, border: '1px solid #e2e8f0', borderRadius: 4, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#0b1c30', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.borderColor = '#0b1c30'; e.target.style.background = '#fff'; }}
                  onBlur={e =>  { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button disabled={isPending} onClick={() => hasRule ? handleUpdate(rule) : handleCreate(p)}
                  style={{
                    height: 30, padding: '0 14px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    border: wasSaved ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                    background: wasSaved ? '#f0fdf4' : '#fff',
                    color: wasSaved ? '#16a34a' : '#374151',
                    cursor: isPending ? 'default' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isPending && !wasSaved) { e.currentTarget.style.borderColor = '#0b1c30'; e.currentTarget.style.color = '#0b1c30'; } }}
                  onMouseLeave={e => { if (!wasSaved) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#374151'; } }}
                >
                  {wasSaved
                    ? <><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Saved</>
                    : hasRule ? 'Update' : 'Set'
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Notification Channels ────────────────────────────────────────── */}
      <NotificationStrip
        company={company} setCompany={setCompany}
        slackUrl={slackUrl} setSlackUrl={setSlackUrl}
        railSaved={railSaved}
        onSave={e => { e.preventDefault(); setRailSaved(true); setTimeout(() => setRailSaved(false), 2800); }}
      />

      {/* ── Bottom stat bar ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        {[
          { label: 'Configured Tiers', value: `${configuredCount} / 4`, sub: 'priority tiers set' },
          { label: 'Avg Deadline',     value: avgHrs === '—' ? '—' : `${avgHrs}h`, sub: 'across configured tiers', mono: true },
          { label: 'Policy Compliance',value: '99.8%', sub: 'trailing 30 days', mono: true, accent: '#16a34a' },
          { label: 'Pending Sync',     value: '0', sub: 'changes awaiting push', mono: true },
        ].map((s, i) => (
          <div key={s.label} style={{ background: '#fff', padding: '14px 20px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: s.mono ? "'JetBrains Mono', monospace" : 'inherit', fontSize: 24, fontWeight: 700, color: s.accent ?? '#0b1c30', lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
