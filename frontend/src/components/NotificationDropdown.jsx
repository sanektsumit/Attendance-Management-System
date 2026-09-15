import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle,
  Clock,
  Calendar,
  CheckCheck,
  AlertTriangle,
  XCircle,
  Trash2,
  Send,
  X,
  MessageSquarePlus,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Relative time formatter
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Complaint Form State
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintPriority, setComplaintPriority] = useState('NORMAL');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await axiosClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Graceful silence on background poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Real-time polling every 12 seconds
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {}
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    try {
      await axiosClient.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Notifications cleared');
    } catch (err) {}
  };

  // Submit Complaint / Inquiry
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) {
      toast.error('Please enter subject and description');
      return;
    }
    setSubmittingComplaint(true);
    try {
      const res = await axiosClient.post('/notifications/complaint', {
        subject: complaintSubject.trim(),
        description: complaintDesc.trim(),
        priority: complaintPriority,
      });
      if (res.data.success) {
        toast.success('Complaint submitted! HR Admin has been notified.');
        setShowComplaintModal(false);
        setComplaintSubject('');
        setComplaintDesc('');
        fetchNotifications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ATTENDANCE') {
      return n.type === 'attendance_in' || n.type === 'attendance_out';
    }
    if (activeFilter === 'LEAVES') {
      return n.type === 'leave_applied' || n.type === 'leave_approved' || n.type === 'leave_rejected';
    }
    if (activeFilter === 'COMPLAINTS') {
      return n.type === 'complaint';
    }
    return true; // 'ALL'
  });

  // Get icon and color style for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'attendance_in':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <LogIn className="h-4 w-4" />
          </div>
        );
      case 'attendance_out':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <LogOut className="h-4 w-4" />
          </div>
        );
      case 'leave_applied':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Calendar className="h-4 w-4" />
          </div>
        );
      case 'leave_approved':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCheck className="h-4 w-4" />
          </div>
        );
      case 'leave_rejected':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="h-4 w-4" />
          </div>
        );
      case 'complaint':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Bell className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800/80 transition focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-extrabold text-white ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="rounded-lg p-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="rounded-lg p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/30 px-3 py-1.5 text-[11px] font-semibold text-slate-400 gap-1 overflow-x-auto">
            {['ALL', 'ATTENDANCE', 'LEAVES', 'COMPLAINTS'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-2.5 py-1 transition ${
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {filter === 'ALL'
                  ? 'All'
                  : filter === 'ATTENDANCE'
                  ? 'Attendance'
                  : filter === 'LEAVES'
                  ? 'Leaves'
                  : 'Complaints'}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-400">No notifications yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Live updates for attendance, leaves, and inquiries will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`flex items-start gap-3 p-3.5 transition cursor-pointer hover:bg-slate-800/40 ${
                    !notif.isRead ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {getNotificationIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          !notif.isRead ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 self-center"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Action: Report Complaint / Inquiry */}
          <div className="border-t border-slate-800/80 bg-slate-950/60 p-2.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowComplaintModal(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/10 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 transition"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>Raise Complaint / Inquiry</span>
            </button>
          </div>
        </div>
      )}

      {/* Complaint / Inquiry Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Submit Complaint or Inquiry</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Submit your request, attendance grievance, or HR inquiry. Both you and HR Admin will receive notifications.
            </p>

            <form onSubmit={handleSubmitComplaint} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Subject / Issue Title</label>
                <input
                  type="text"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  placeholder="e.g. Attendance punch correction request"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Priority Level</label>
                <select
                  value={complaintPriority}
                  onChange={(e) => setComplaintPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="LOW">Low - General Question</option>
                  <option value="NORMAL">Normal - Routine Request</option>
                  <option value="URGENT">Urgent - Attendance / Salary Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="Describe your inquiry or grievance in detail..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  required
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition disabled:opacity-50"
                >
                  {submittingComplaint ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit to HR Admin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
