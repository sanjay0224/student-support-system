import React from 'react';

const priorityConfigs = {
  critical: { label: 'CRITICAL', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' },
  high: { label: 'High', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  medium: { label: 'Medium', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  low: { label: 'Low', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
};

export default function PriorityBadge({ priority }) {
  const config = priorityConfigs[priority] || { label: priority, bg: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${config.bg}`}>
      {config.label}
    </span>
  );
}
