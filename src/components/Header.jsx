import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import { Bell, LogOut, ShieldCheck, UserCheck, GraduationCap, Check, Sparkles } from 'lucide-react';

export default function Header({ onSelectTicket }) {
  const { user, logout, login } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await notificationApi.markAsRead(notif.id);
      fetchNotifs();
    }
    if (notif.ticket_id && onSelectTicket) {
      onSelectTicket(notif.ticket_id);
    }
    setShowNotifs(false);
  };

  const switchAccount = async (email, password) => {
    setShowRoleSwitcher(false);
    await login(email, password);
  };

  const roleIcons = {
    student: <GraduationCap className="w-4 h-4 text-emerald-400" />,
    staff: <UserCheck className="w-4 h-4 text-blue-400" />,
    manager: <ShieldCheck className="w-4 h-4 text-purple-400" />,
  };

  const roleColors = {
    student: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    staff: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    manager: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight leading-none flex items-center gap-2">
              EduCare
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Ticket Desk
              </span>
            </h1>
            <p className="text-xs text-slate-400">Student Support Portal</p>
          </div>
        </div>

        {/* User Info & Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            
            {/* Quick Role Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 transition"
              >
                <span>Demo Switch Role</span>
                <span className="text-slate-500">▼</span>
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                    Switch Active Persona
                  </div>
                  <button
                    onClick={() => switchAccount('student1@college.edu', 'Student@123')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/50 text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-400" /> Student View
                    </span>
                    {user.role === 'student' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => switchAccount('staff1@college.edu', 'Staff@123')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/50 text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" /> Staff View
                    </span>
                    {user.role === 'staff' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                  <button
                    onClick={() => switchAccount('manager@college.edu', 'Manager@123')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/50 text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" /> Manager View
                    </span>
                    {user.role === 'manager' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 cursor-pointer transition hover:bg-slate-700/40 ${
                            !n.is_read ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : 'opacity-70'
                          }`}
                        >
                          <div className="font-medium text-xs text-white">{n.title}</div>
                          <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div className="flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${roleColors[user.role]}`}>
                    {roleIcons[user.role]}
                    <span className="ml-1">{user.role}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg border border-slate-700 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
