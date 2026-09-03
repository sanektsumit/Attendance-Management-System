import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Users, UserCheck, AlertTriangle, UserX, Calendar, CheckSquare, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock trend data for Recharts visualizer
  const trendData = [
    { day: 'Mon', Present: 42, Late: 4, Absent: 2 },
    { day: 'Tue', Present: 45, Late: 2, Absent: 1 },
    { day: 'Wed', Present: 44, Late: 3, Absent: 1 },
    { day: 'Thu', Present: 41, Late: 5, Absent: 2 },
    { day: 'Fri', Present: 46, Late: 1, Absent: 1 },
    { day: 'Sat', Present: 30, Late: 2, Absent: 16 },
  ];

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">HR Command Center</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time workforce attendance & operational summary</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Staff</span>
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.totalEmployees || 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active team members</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Present</span>
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{stats?.present || 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Punched in on time</span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Late</span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{stats?.late || 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Checked in post grace period</span>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Absent</span>
            <UserX className="h-5 w-5 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{stats?.absent || 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">No record for today</span>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Pending Leaves</span>
            <CheckSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400">{stats?.pendingLeavesCount || 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Requires HR review</span>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Weekly Attendance Trends</h2>
          </div>
          <span className="text-xs text-slate-400">Past 7 Days Overview</span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
              <Area type="monotone" dataKey="Present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" />
              <Area type="monotone" dataKey="Late" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
