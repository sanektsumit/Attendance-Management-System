import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Users, UserCheck, AlertTriangle, UserX, Calendar, CheckSquare, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState('7d');
  const [trendData, setTrendData] = useState([]);

  const fetchStats = async (range = selectedRange) => {
    setTrendLoading(true);
    try {
      const res = await axiosClient.get(`/admin/stats?range=${range}`);
      if (res.data.success) {
        setStats(res.data.stats);
        if (res.data.weeklyTrend && Array.isArray(res.data.weeklyTrend)) {
          setTrendData(res.data.weeklyTrend);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedRange);
  }, [selectedRange]);

  const getXAxisInterval = () => {
    if (trendData.length <= 10) return 0;
    if (trendData.length <= 15) return 1;
    if (trendData.length <= 30) return 3;
    if (trendData.length <= 90) return 9;
    if (trendData.length <= 180) return 18;
    return 36;
  };

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

      {/* Attendance Chart with Range Filter Dropdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                {selectedRange === '7d' ? 'Weekly Attendance Trends' : 'Attendance Trends'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Legend Pins */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span> Present
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span> Late
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span> Absent
              </span>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-slate-200 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <select
                id="attendance-trends-range-select"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="7d" className="bg-slate-900 text-white">Last 7 Days</option>
                <option value="10d" className="bg-slate-900 text-white">Last 10 Days</option>
                <option value="15d" className="bg-slate-900 text-white">Last 15 Days</option>
                <option value="1m" className="bg-slate-900 text-white">Last Month</option>
                <option value="3m" className="bg-slate-900 text-white">Last 3 Months</option>
                <option value="6m" className="bg-slate-900 text-white">Last 6 Months</option>
                <option value="1y" className="bg-slate-900 text-white">Last 1 Year</option>
              </select>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {trendData.length > 0 ? (
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
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tickLine={false} interval={getXAxisInterval()} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" allowDecimals={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                  labelFormatter={(label, payload) => {
                    const item = payload && payload[0] && payload[0].payload;
                    return item ? `${item.date} (${item.day})` : label;
                  }}
                />
                <Area type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="Late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" />
                <Area type="monotone" dataKey="Absent" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAbsent)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              {trendLoading ? 'Loading attendance trend data...' : 'No attendance data available for the selected period.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
