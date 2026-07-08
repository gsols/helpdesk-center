/**
 * ForbiddenPage (ui-ux-blueprint.md §3 — 403 Error Boundary)
 *
 * Full-screen, sharp-edged access denied blocker.
 * Shown when an agent attempts to access a cross-department ticket.
 * Design rules: rounded-none (structural), no shadow.
 */
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      {/* Card — structural container, rounded-none */}
      <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 rounded-none p-10 w-full max-w-md text-center">
        {/* Icon container — structural, rounded-none */}
        <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-none flex items-center justify-center mx-auto mb-5">
          <ShieldX size={26} className="text-red-600 dark:text-red-400" strokeWidth={1.5} />
        </div>

        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 tracking-tight">
          Access Denied
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          You do not have permission to view this ticket. Cross-department access is strictly
          restricted to protect sensitive organizational data.
        </p>

        <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-500 border border-neutral-100 dark:border-neutral-800 rounded-none px-3 py-2 mb-6">
          <span className="font-mono">HTTP 403 Forbidden</span>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 h-9 px-5 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-700 rounded hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
      </div>
    </div>
  );
}
