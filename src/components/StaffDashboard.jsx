import React, { useState, useEffect } from 'react';
import { dashboardApi, ticketApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SLABadge from './SLABadge';
import TicketDetailModal from './TicketDetailModal';
import {
  Inbox,
  UserCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle,
  TrendingUp,
  UserPlus
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [viewTab, setViewTab] = useState('assigned'); // assigned | unassigned | all
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, ticketRes] = await Promise.all([
        dashboardApi.getStaffDashboard(),
        ticketApi.getTickets(),
      ]);

      if (dashRes.success) setStats(dashRes.stats);
      if (ticketRes.success) setTickets(ticketRes.tickets || []);
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignToSelf = async (e, ticketId) => {
    e.stopPropagation();
    try {
      await ticketApi.assign(ticketId, user.id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    // View Tab filter
    if (viewTab === 'assigned' && t.assigned_to !== user.id) return false;
    if (viewTab === 'unassigned' && t.assigned_to !== null) return false;

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = t.subject.toLowerCase().includes(q);
      const matchNum = t.ticket_number.toLowerCase().includes(q);
      const matchStudent = t.student_name?.toLowerCase().includes(q);
      if (!matchSub && !matchNum && !matchStudent) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Staff Support Console</h2>
          <p className="text-xs text-slate-300 mt-1">
            Welcome back, <strong className="text-blue-400">{user.name}</strong>! Review assigned tickets, process student issues, add internal notes, and monitor SLA deadlines.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">My Assigned</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {stats ? stats.assignedToMe : 0}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Unassigned Pool</span>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {tickets.filter((t) => !t.assigned_to).length}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Due Soon ({"<"}2h)</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats ? stats.dueSoon : 0}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">SLA Breached</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {stats ? stats.overdue : 0}
          </div>
        </div>

      </div>

      {/* Main Ticket Processing Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 pt-2">
          <button
            onClick={() => setViewTab('assigned')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
              viewTab === 'assigned'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> My Assigned Tickets ({tickets.filter((t) => t.assigned_to === user.id).length})
          </button>

          <button
            onClick={() => setViewTab('unassigned')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
              viewTab === 'unassigned'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" /> Unassigned Pool ({tickets.filter((t) => !t.assigned_to).length})
          </button>

          <button
            onClick={() => setViewTab('all')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
              viewTab === 'all'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All College Tickets ({tickets.length})
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student name, #, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Status: All</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Priority: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Ticket Feed List */}
        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading support queue...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No tickets match criteria</p>
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="p-4 hover:bg-slate-800/40 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {t.ticket_number}
                    </span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <SLABadge ticket={t} />
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{t.subject}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Student: <strong className="text-slate-200">{t.student_name}</strong></span>
                    <span>•</span>
                    <span>Category: <strong className="text-slate-300">{t.category_name}</strong></span>
                    <span>•</span>
                    <span>Assigned: <strong className="text-slate-300">{t.assigned_to_name || 'Unassigned'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!t.assigned_to && (
                    <button
                      onClick={(e) => handleAssignToSelf(e, t.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition shadow"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Claim Ticket
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicketId(t.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                  >
                    Open Console →
                  </button>
                </div>
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
