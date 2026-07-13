/**
 * ManagerDashboard — Department Manager role page
 *
 * Each sidebar nav item routes to its own URL:
 *   /manager           → Queue (ManagerQueueTable)
 *   /manager/team      → Team Directory (ManagerTeamDirectory)
 *   /manager/analytics → SLA / Analytics (ManagerAnalyticsPanel)
 *   /manager/risk      → Risk Queue (ManagerRiskQueue)
 *
 * The `tab` prop is passed from App.jsx route config.
 */
import AppShell from '../components/AppShell';
import ManagerQueueTable      from '../components/ManagerQueueTable';
import ManagerTeamDirectory   from '../components/ManagerTeamDirectory';
import ManagerAnalyticsPanel  from '../components/ManagerAnalyticsPanel';
import ManagerRiskQueue       from '../components/ManagerRiskQueue';

const TAB_TITLES = {
  queue:     'Manager Dashboard',
  team:      'Team Directory',
  analytics: 'SLA / Analytics',
  risk:      'Risk Queue',
};

export default function ManagerDashboard({ tab = 'queue' }) {
  /* Queue tab is a full-height split pane — no AppShell padding */
  const noPadding = tab === 'queue';
  return (
    <AppShell title={TAB_TITLES[tab] ?? 'Manager Dashboard'} noPadding={noPadding}>
      {tab === 'queue'     && <ManagerQueueTable />}
      {tab === 'team'      && <ManagerTeamDirectory />}
      {tab === 'analytics' && <ManagerAnalyticsPanel />}
      {tab === 'risk'      && <ManagerRiskQueue />}
    </AppShell>
  );
}
