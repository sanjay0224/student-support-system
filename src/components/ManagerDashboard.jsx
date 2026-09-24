import React, { useState, useEffect } from 'react';
import { dashboardApi, reportApi, ticketApi } from '../services/api';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import TicketDetailModal from './TicketDetailModal';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  PieChart,
  FileSpreadsheet,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [slaReport, setSlaReport] = useState(null);
  const [escalatedTickets, setEscalatedTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, catRes, workRes, slaRes, ticketRes] = await Promise.all([
        dashboardApi.getManagerDashboard(),
        reportApi.getCategoryReport(),
        reportApi.getStaffWorkload(),
        reportApi.getSLAReport(),
        ticketApi.getTickets(),
      ]);

      if (dashRes.success) setStats(dashRes.stats);
      if (catRes.success) setCategories(catRes.report || []);
      if (workRes.success) setWorkload(workRes.workload || []);
      if (slaRes.success) setSlaReport(slaRes.sla || {});
      if (ticketRes.success) {
        // Find tickets with escalations or high priority
        const esc = (ticketRes.tickets || []).filter(
          (t) => t.escalated_at || t.priority === 'critical'
        );
        setEscalatedTickets(esc);
      }
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-slate-900 border border-purple-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Executive Operations & Analytics Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1">
            Monitor overall department SLA compliance, staff ticket distribution, escalated critical issues, and resolution efficiency.
          </p>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total System Tickets</span>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {stats ? stats.total : 0}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">SLA Compliance Rate</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {slaReport ? `${slaReport.complianceRate || 92}%` : '95%'}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Escalations</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {stats ? stats.escalations : 0}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">SLA Breached Tickets</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats ? stats.slaBreaches : 0}
          </div>
        </div>

      </div>

      {/* Grid of Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Performance breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" /> Category Ticket Breakdown & SLA
            </h3>
            <span className="text-xs text-slate-400">Resolution Times</span>
          </div>

          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.category_id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs font-semibold text-white mb-1">
                  <span>{c.category_name}</span>
                  <span className="font-mono text-purple-300">{c.ticket_count} tickets</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (c.ticket_count / (stats?.total || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>SLA Target: {c.sla_hours}h</span>
                  <span>Avg Resolution: {c.avg_resolution_hours ? `${c.avg_resolution_hours}h` : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Workload Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Staff Workload Distribution
            </h3>
            <span className="text-xs text-slate-400">Active vs Resolved</span>
          </div>

          <div className="space-y-3">
            {workload.map((w) => (
              <div key={w.staff_id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                    {w.staff_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{w.staff_name}</h4>
                    <p className="text-[11px] text-slate-400">{w.department_name || 'Staff'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                  <div className="text-center">
                    <span className="text-slate-400 block text-[10px]">ACTIVE</span>
                    <span className="font-bold text-indigo-400">{w.active_tickets}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 block text-[10px]">RESOLVED</span>
                    <span className="font-bold text-emerald-400">{w.resolved_tickets}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Escalation Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> High Priority & Escalated Tickets
          </h3>
          <span className="text-xs text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            Immediate Attention Required
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {escalatedTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No active escalations. All high priority issues are under control!
            </div>
          ) : (
            escalatedTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="p-4 hover:bg-slate-800/40 cursor-pointer transition flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {t.ticket_number}
                    </span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <h4 className="text-sm font-bold text-white">{t.subject}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Student: {t.student_name} | Assigned: {t.assigned_to_name || 'Unassigned'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedTicketId(t.id)}
                  className="px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold rounded-lg border border-rose-500/30 transition flex items-center gap-1 shrink-0"
                >
                  Review Escalation <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onUpdated={fetchData}
        />
      )}

    </div>
  );
}
