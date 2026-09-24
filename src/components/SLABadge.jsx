import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SLABadge({ ticket }) {
  if (!ticket || !ticket.due_at) return null;

  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    return (
      <span className="inline-flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Resolved
      </span>
    );
  }

  const now = new Date();
  const due = new Date(ticket.due_at);
  const diffHours = (due - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueBy = Math.abs(Math.round(diffHours));
    return (
      <span className="inline-flex items-center text-xs text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded border border-rose-500/40 animate-pulse font-semibold">
        <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
        SLA Breached ({overdueBy}h overdue)
      </span>
    );
  } else if (diffHours <= 2) {
    const mins = Math.round(diffHours * 60);
    return (
      <span className="inline-flex items-center text-xs text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/40 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
        Due Soon ({mins}m left)
      </span>
    );
  } else {
    const hours = Math.round(diffHours);
    return (
      <span className="inline-flex items-center text-xs text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
        <Clock className="w-3.5 h-3.5 mr-1 text-indigo-400" />
        {hours}h remaining
      </span>
    );
  }
}
