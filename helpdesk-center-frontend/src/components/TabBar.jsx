/**
 * Reusable tab bar component.
 * Props:
 *   tabs  — [{ id, label, count? }]
 *   value — active tab id
 *   onChange — (id) => void
 */
export default function TabBar({ tabs, value, onChange }) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
            ${value === tab.id
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          {tab.label}
          {tab.count != null && (
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full font-semibold
              ${value === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}
            `}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
