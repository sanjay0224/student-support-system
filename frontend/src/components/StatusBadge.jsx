import React from 'react';

const statusConfigs = {
  open: { label: 'Open', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'In Progress', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  pending: { label: 'Pending', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  resolved: { label: 'Resolved', bg: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
  closed: { label: 'Closed', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

export default function StatusBadge({ status }) {
  const config = statusConfigs[status] || { label: status, bg: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
      {config.label}
    </span>
  );
}
