import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Briefcase, Calendar, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ApplyLeave = () => {
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLeaves = async () => {
    try {
      const res = await axiosClient.get('/leaves/mine');
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosClient.post('/leaves', {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      if (res.data.success) {
        toast.success('Leave application submitted successfully');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchMyLeaves();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit leave application';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Pending HR Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Leave Management</h1>
        <p className="text-sm text-slate-400 mt-1">Apply for time off and track your leave request approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="md:col-span-1 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-400" /> Apply For Time Off
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="CASUAL">Casual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="ANNUAL">Annual Paid Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                placeholder="Explain the purpose for time off..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Leave Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Leave Requests Log */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-4">My Leave Request History</h2>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading leave records...</div>
          ) : leaves.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No leave requests submitted yet.</div>
          ) : (
            <div className="space-y-3">
              {leaves.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      {item.startDate} to {item.endDate}
                    </span>
                    {getLeaveBadge(item.status)}
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Type:</span> {item.leaveType} | <span className="font-semibold text-slate-400">Reason:</span> {item.reason}
                  </div>
                  {item.adminComment && (
                    <div className="text-xs text-indigo-300 bg-indigo-500/10 rounded-lg p-2 border border-indigo-500/20">
                      <strong>HR Note:</strong> {item.adminComment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
