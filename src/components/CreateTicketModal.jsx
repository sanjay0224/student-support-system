import React, { useState } from 'react';
import { ticketApi } from '../services/api';
import { X, Plus, Paperclip, AlertCircle } from 'lucide-react';

export default function CreateTicketModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    subject: '',
    categoryId: '1', // Default to Fees
    priority: 'medium',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const categories = [
    { id: 1, name: 'Fees & Payment', sla: '24h SLA' },
    { id: 2, name: 'Attendance Record', sla: '48h SLA' },
    { id: 3, name: 'ID Card Replacement', sla: '48h SLA' },
    { id: 4, name: 'Certificates & Transcripts', sla: '8h SLA' },
    { id: 5, name: 'Document Verification', sla: '24h SLA' },
    { id: 6, name: 'Other Issue', sla: '48h SLA' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await ticketApi.createTicket({
        subject: formData.subject,
        categoryId: parseInt(formData.categoryId),
        priority: formData.priority,
        description: formData.description,
      });

      if (res.success) {
        if (onCreated) onCreated();
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to create ticket');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error while creating ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Raise New Support Ticket</h2>
              <p className="text-xs text-slate-400">Submit an official request to administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ticket Subject / Issue Summary <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fee receipt generated with incorrect transaction date"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Issue Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.sla})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority Level <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low Priority (48h resolution)</option>
                <option value="medium">Medium Priority (24h resolution)</option>
                <option value="high">High Priority (8h resolution)</option>
                <option value="critical">Critical Urgent (4h resolution)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe the issue, relevant dates, roll numbers, or error details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* File Attachment Mock */}
          <div className="p-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-500" /> Optional Supporting Document Attachment
            </span>
            <button
              type="button"
              onClick={() => alert('Attachment simulation enabled!')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[11px] text-slate-200"
            >
              Choose File
            </button>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
