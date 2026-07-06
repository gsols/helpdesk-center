import { useFrt, useMttr, useAiAccuracy } from '../hooks/useAnalytics';
import { Clock, TrendingDown, BrainCircuit } from 'lucide-react';

function KpiCard({ label, value, unit, icon: Icon, color, bg }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex items-center gap-4 flex-1 min-w-48">
      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800">
          {value != null ? (typeof value === 'number' ? value.toFixed(1) : value) : '—'}
          {value != null && unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsPanel() {
  const { data: frt   } = useFrt();
  const { data: mttr  } = useMttr();
  const { data: aiAcc } = useAiAccuracy();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="flex gap-4 flex-wrap">
        <KpiCard
          label="Avg First Response Time"
          value={frt?.averageFirstResponseTimeHours != null ? Number(frt.averageFirstResponseTimeHours) : null}
          unit="hrs"
          icon={Clock}
          color="#3b82d4"
          bg="#eff6ff"
        />
        <KpiCard
          label="AI Classification Accuracy"
          value={aiAcc?.accuracyPercentage != null ? Number(aiAcc.accuracyPercentage) : null}
          unit="%"
          icon={BrainCircuit}
          color="#7c3aed"
          bg="#f5f3ff"
        />
      </div>

      {/* MTTR Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <TrendingDown size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Mean Time to Resolution by Department</h3>
        </div>
        {!mttr || mttr.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No resolved tickets yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2">Department</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2">Avg Hours to Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mttr.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-700 font-medium">{row.departmentName ?? 'Uncategorized'}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 text-right font-mono">
                    {row.meanTimeToResolutionHours != null ? Number(row.meanTimeToResolutionHours).toFixed(1) : '—'} hrs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
