/**
 * AdminDashboard
 *
 * Uses the shared AppShell (same sidebar + header as every other view).
 * Tab nav is rendered inside the content area — driven by ?tab= query param.
 *
 * Tabs:
 *   overview   → AdminOverviewPanel  (live backend data)
 *   triage     → TriageQueue
 *   analytics  → AnalyticsPanel
 *   sla        → SlaConfigPanel
 */
import { useSearchParams } from 'react-router-dom';
import AppShell            from '../components/AppShell';
import AdminOverviewPanel  from '../components/AdminOverviewPanel';
import TriageQueue         from '../components/TriageQueue';
import AnalyticsPanel      from '../components/AnalyticsPanel';
import SlaConfigPanel      from '../components/SlaConfigPanel';
import DepartmentManager   from '../components/DepartmentManager';

const TABS = [
  { id: 'overview',     label: 'Overview'     },
  { id: 'triage',       label: 'Triage Queue' },
  { id: 'analytics',    label: 'Analytics'    },
  { id: 'sla',          label: 'SLA Rules'    },
  { id: 'departments',  label: 'Departments'  },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setTab = (id) => setSearchParams({ tab: id });

  const content = (() => {
    switch (activeTab) {
      case 'triage':      return <TriageQueue />;
      case 'analytics':   return <AnalyticsPanel />;
      case 'sla':         return <SlaConfigPanel />;
      case 'departments': return <DepartmentManager />;
      default:            return <AdminOverviewPanel />;
    }
  })();

  return (
    <AppShell title="Admin">
      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 24,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #0b1c30' : '2px solid transparent',
              color: activeTab === tab.id ? '#0b1c30' : '#76777d',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 150ms, border-color 150ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#0b1c30'; }}
            onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#76777d'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {content}
    </AppShell>
  );
}
