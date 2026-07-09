/**
 * ManagerDashboard — Department Manager role page
 *
 * Uses AppShell with 3-tab internal navigation:
 *   1. Queue — active ticket queue with SLA tracking (ManagerQueueTable)
 *   2. Analytics — workload matrix + metrics (ManagerAnalyticsPanel)
 *   3. Risk Queue — near-breach and breached tickets (ManagerRiskQueue)
 *
 * Header: "Support Portal" breadcrumb + Queue | SLA | Reports tabs in top bar
 */
import { useState } from 'react';
import AppShell            from '../components/AppShell';
import ManagerQueueTable   from '../components/ManagerQueueTable';
import ManagerAnalyticsPanel from '../components/ManagerAnalyticsPanel';
import ManagerRiskQueue    from '../components/ManagerRiskQueue';

const TABS = [
  { key: 'queue',     label: 'Queue' },
  { key: 'analytics', label: 'SLA / Analytics' },
  { key: 'risk',      label: 'Risk Queue' },
];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <AppShell title="Manager Dashboard">
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '1px solid #e2e8f0', marginBottom: 20,
        marginLeft: -24, marginRight: -24, marginTop: -24,
        paddingLeft: 24,
        background: '#ffffff',
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '12px 20px',
              fontSize: 14, fontWeight: activeTab === key ? 700 : 400,
              color: activeTab === key ? '#0f172a' : '#64748b',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === key ? '2px solid #0f172a' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '0' }}>
        {activeTab === 'queue'     && <ManagerQueueTable />}
        {activeTab === 'analytics' && <ManagerAnalyticsPanel />}
        {activeTab === 'risk'      && <ManagerRiskQueue />}
      </div>
    </AppShell>
  );
}
