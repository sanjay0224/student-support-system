import React, { useState, useEffect } from 'react';
import { ticketApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SLABadge from './SLABadge';
import {
  X,
  MessageSquare,
  Lock,
  UserCheck,
  Send,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Clock,
  Shield,
  FileText
} from 'lucide-react';

export default function TicketDetailModal({ ticketId, onClose, onUpdated }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);

  // Input states
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');

  // UI state tabs/drawers
  const [activeTab, setActiveTab] = useState('conversation'); // conversation | activity
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getTicketById(ticketId);
      if (res.success) {
        setTicket(res.ticket);
        setSelectedStaff(res.ticket.assigned_to || '');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    if (user.role === 'staff' || user.role === 'manager') {
      userApi.getStaffList().then((res) => {
        if (res.success) setStaffList(res.staff || []);
      });
    }
  }, [ticketId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await ticketApi.reply(ticketId, replyText);
      setReplyText('');
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await ticketApi.addInternalNote(ticketId, noteText);
      setNoteText('');
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (staffId) => {
    try {
      await ticketApi.assign(ticketId, staffId);
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ticketApi.updateStatus(ticketId, newStatus);
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await ticketApi.updatePriority(ticketId, newPriority);
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionComment.trim()) return;
    setSubmitting(true);
    try {
      await ticketApi.resolve(ticketId, resolutionComment);
      setShowResolveForm(false);
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setSubmitting(true);
    try {
      await ticketApi.reopen(ticketId, reopenReason);
      setShowReopenForm(false);
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalateReason.trim()) return;
    setSubmitting(true);
    try {
      await ticketApi.escalate(ticketId, escalateReason);
      setShowEscalateForm(false);
      fetchDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 font-medium">Loading Ticket Details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const isStaffOrManager = user.role === 'staff' || user.role === 'manager';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-800/80 border-b border-slate-700/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                {ticket.ticket_number}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <SLABadge ticket={ticket} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{ticket.subject}</h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>Category: <strong className="text-slate-200">{ticket.category_name}</strong></span>
              <span>•</span>
              <span>Raised by: <strong className="text-slate-200">{ticket.student_name}</strong></span>
              <span>•</span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 flex-1 overflow-hidden">
          
          {/* Main conversation / thread column */}
          <div className="lg:col-span-2 flex flex-col h-full overflow-hidden bg-slate-900/50">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 pt-2">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
                  activeTab === 'conversation'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Ticket Thread ({ticket.messages ? ticket.messages.length : 0})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
                  activeTab === 'activity'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" /> Activity Audit ({ticket.activity ? ticket.activity.length : 0})
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Ticket Initial Description Box */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-indigo-300">{ticket.student_name} (Student)</span>
                  <span>{new Date(ticket.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Resolution Comment if resolved */}
              {ticket.resolution_comment && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                    <CheckCircle className="w-4 h-4" /> Official Resolution Comment
                  </div>
                  <p className="text-sm text-emerald-200">{ticket.resolution_comment}</p>
                  <div className="text-[10px] text-emerald-400/70 mt-1">
                    Resolved at: {new Date(ticket.resolved_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Thread Messages */}
              {activeTab === 'conversation' && (
                <div className="space-y-4 mt-4">
                  {ticket.messages && ticket.messages.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No replies added yet.</p>
                  )}
                  {ticket.messages && ticket.messages.map((msg) => {
                    const isInternal = msg.message_type === 'internal_note';
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl border transition ${
                          isInternal
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : msg.sender_role === 'student'
                            ? 'bg-slate-800/80 border-slate-700/80'
                            : 'bg-indigo-500/10 border-indigo-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{msg.sender_name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-bold">
                              {msg.sender_role}
                            </span>
                            {isInternal && (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded">
                                <Lock className="w-3 h-3 mr-1" /> Internal Staff Note
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Activity Audit Timeline */}
              {activeTab === 'activity' && (
                <div className="space-y-3 mt-2">
                  {ticket.activity && ticket.activity.map((act) => (
                    <div key={act.id} className="flex gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                      <div className="flex-1 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex justify-between font-medium text-slate-300">
                          <span>{act.user_name || 'System'} {act.description || act.action}</span>
                          <span className="text-slate-500 text-[10px]">{new Date(act.created_at).toLocaleString()}</span>
                        </div>
                        {act.old_value && act.new_value && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            Changed from <span className="text-rose-400 font-mono">{act.old_value}</span> to{' '}
                            <span className="text-emerald-400 font-mono">{act.new_value}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Input Form at bottom */}
            {ticket.status !== 'closed' && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                
                {/* Reply Form */}
                <form onSubmit={handleReply} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a public reply..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !replyText.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Send className="w-4 h-4" />
                    Reply
                  </button>
                </form>

                {/* Internal Note Form for Staff/Manager */}
                {isStaffOrManager && (
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="🔒 Add private internal staff note..."
                      className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-200 placeholder-amber-400/50 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !noteText.trim()}
                      className="px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
                    >
                      + Note
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sidebar / Actions column */}
          <div className="p-6 bg-slate-900 flex flex-col justify-between space-y-6 overflow-y-auto">
            
            {/* Status & Priority Controls */}
            <div className="space-y-5">
              
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Ticket Control Panel
              </h3>

              {/* Assignment (Staff/Manager only) */}
              {isStaffOrManager && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assigned Staff Member
                  </label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => handleAssign(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department_name || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Status Update */}
              {isStaffOrManager && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Update Workflow Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['open', 'assigned', 'in_progress', 'pending'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border capitalize text-left transition ${
                          ticket.status === st
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Control */}
              {isStaffOrManager && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Update Priority (Recalculates SLA)
                  </label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low (48h SLA)</option>
                    <option value="medium">Medium (24h SLA)</option>
                    <option value="high">High (8h SLA)</option>
                    <option value="critical">Critical (4h SLA)</option>
                  </select>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                
                {/* Resolve Action */}
                {isStaffOrManager && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <div>
                    {!showResolveForm ? (
                      <button
                        onClick={() => setShowResolveForm(true)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle className="w-4 h-4" /> Resolve Ticket
                      </button>
                    ) : (
                      <form onSubmit={handleResolve} className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2">
                        <textarea
                          rows={2}
                          required
                          value={resolutionComment}
                          onChange={(e) => setResolutionComment(e.target.value)}
                          placeholder="Provide final resolution notes..."
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-emerald-600 text-white py-1 rounded text-xs font-bold"
                          >
                            Submit Resolution
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResolveForm(false)}
                            className="px-2 bg-slate-800 text-slate-400 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Reopen Action (if resolved) */}
                {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                  <div>
                    {!showReopenForm ? (
                      <button
                        onClick={() => setShowReopenForm(true)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <RotateCcw className="w-4 h-4" /> Reopen Ticket
                      </button>
                    ) : (
                      <form onSubmit={handleReopen} className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
                        <input
                          type="text"
                          required
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="Reason for reopening ticket..."
                          className="w-full bg-slate-900 border border-amber-500/40 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-amber-600 text-white py-1 rounded text-xs font-bold"
                          >
                            Confirm Reopen
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReopenForm(false)}
                            className="px-2 bg-slate-800 text-slate-400 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Escalate Action */}
                {isStaffOrManager && (
                  <div>
                    {!showEscalateForm ? (
                      <button
                        onClick={() => setShowEscalateForm(true)}
                        className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-400" /> Escalate to Manager
                      </button>
                    ) : (
                      <form onSubmit={handleEscalate} className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2">
                        <input
                          type="text"
                          required
                          value={escalateReason}
                          onChange={(e) => setEscalateReason(e.target.value)}
                          placeholder="Escalation reason for management..."
                          className="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-rose-600 text-white py-1 rounded text-xs font-bold"
                          >
                            Submit Escalation
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowEscalateForm(false)}
                            className="px-2 bg-slate-800 text-slate-400 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </div>

            </div>

            {/* Ticket Metadata box */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Assigned To:</span>
                <span className="text-slate-200 font-medium">{ticket.assigned_to_name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="text-slate-200">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="text-slate-200">{new Date(ticket.due_at).toLocaleDateString()}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
