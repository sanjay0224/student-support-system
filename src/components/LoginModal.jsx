import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, GraduationCap, UserCheck, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

export default function LoginModal() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg('');
    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
    setLoading(false);
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setErrorMsg('');
    const res = await login(demoEmail, demoPassword);
    if (!res.success) {
      setErrorMsg(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">EduCare Portal</h1>
          <p className="text-xs text-slate-400">Student Support & Ticket Management System</p>
        </div>

        {/* Quick Persona Access (For evaluation/testing) */}
        <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            ⚡ Quick Demo 1-Click Login
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickLogin('student1@college.edu', 'Student@123')}
              className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left flex items-center justify-between group transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Student Account</div>
                  <div className="text-[10px] text-slate-400">student1@college.edu</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
            </button>

            <button
              onClick={() => handleQuickLogin('staff1@college.edu', 'Staff@123')}
              className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left flex items-center justify-between group transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Department Staff</div>
                  <div className="text-[10px] text-slate-400">staff1@college.edu</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
            </button>

            <button
              onClick={() => handleQuickLogin('manager@college.edu', 'Manager@123')}
              className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left flex items-center justify-between group transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">College Manager</div>
                  <div className="text-[10px] text-slate-400">manager@college.edu</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase font-semibold">Or enter credentials</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student1@college.edu"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
