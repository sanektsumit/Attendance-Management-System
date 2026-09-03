import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { CheckSquare, CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchLeaves = async () => {
    try {
      const res = await axiosClient.get(`/leaves?status=${statusFilter}`);
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    setActionLoadingId(id);
    try {
      const res = await axiosClient.put(`/leaves/${id}/status`, {
        status,
        adminComment: status === 'APPROVED' ? 'Approved by HR Admin' : 'Request declined due to workload',
      });

      if (res.data.success) {
        toast.success(`Leave request ${status.toLowerCase()}!`);
        fetchLeaves();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update leave status';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Leave Request Approvals</h1>
          <p className="text-sm text-slate-400 mt-1">Review and manage pending employee leave applications</p>
        </div>

        {/* Status Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
          {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900">
            No leave applications matching '{statusFilter}' status.
          </div>
        ) : (
          leaves.map((item) => (
            <div
              key={item._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl hover:border-slate-700/80 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs">
                    {item.user?.name ? item.user.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.user?.name || 'Staff Member'}</h3>
                    <span className="text-xs text-slate-400">{item.user?.department} • {item.user?.designation}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 pt-1">
                  <span className="font-semibold text-slate-400">Duration:</span> {item.startDate} to {item.endDate} |{' '}
                  <span className="font-semibold text-slate-400">Type:</span> {item.leaveType}
                </div>

                <p className="text-xs text-slate-400 italic">"{item.reason}"</p>
              </div>

              {/* Action Buttons */}
              {item.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(item._id, 'APPROVED')}
                    disabled={actionLoadingId === item._id}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(item._id, 'REJECTED')}
                    disabled={actionLoadingId === item._id}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600/20 border border-rose-500/30 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-600/30 transition disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveApprovals;
