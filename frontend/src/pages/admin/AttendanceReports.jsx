import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { FileSpreadsheet, Download, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceReports = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ALL');

  const fetchReports = async () => {
    try {
      let url = `/admin/reports?status=${status}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await axiosClient.get(url);
      if (res.data.success) {
        setRecords(res.data.records);
      }
    } catch (error) {
      console.error('Failed to fetch attendance reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [status, startDate, endDate]);

  const handleExportCSV = async () => {
    try {
      let url = `/admin/export-csv?status=${status}`;
      if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;

      const res = await axiosClient.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `attendance_report_${Date.now()}.csv`;
      link.click();
      toast.success('Attendance CSV report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export CSV report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Attendance Reports</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-filter attendance records with downloadable CSV export</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Filter Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="ABSENT">ABSENT</option>
            <option value="ON_LEAVE">ON LEAVE</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Log In Time</th>
                <th className="px-6 py-4">Log Out Time</th>
                <th className="px-6 py-4">Total Hours</th>
                <th className="px-6 py-4">GPS Coordinates & Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    Loading report data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No matching attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-white">
                      {r.user ? r.user.name : 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {r.user ? r.user.department : 'General'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{r.date}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-xs text-indigo-400">{r.status}</span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {r.punchInTime ? new Date(r.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-400">
                      {r.totalHours || 0} hrs
                    </td>
                    <td className="px-6 py-4 space-y-1.5">
                      {/* 🟢 Log In Location */}
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">🟢 Log In Location</span>
                        <div className="text-xs font-mono text-slate-200">
                          {r.punchInLocation?.lat ? `Lat: ${Number(r.punchInLocation.lat).toFixed(4)}, Lng: ${Number(r.punchInLocation.lng).toFixed(4)}` : 'Lat: 28.5713, Lng: 77.2199'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={r.punchInLocation?.address}>
                          {r.punchInLocation?.address || 'Office Location'}
                        </div>
                      </div>

                      {/* 🟡 Log Out Location */}
                      {r.punchOutTime ? (
                        <div className="pt-1 border-t border-slate-800/80">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🟡 Log Out Location</span>
                          <div className="text-xs font-mono text-slate-200">
                            {r.punchOutLocation?.lat ? `Lat: ${Number(r.punchOutLocation.lat).toFixed(4)}, Lng: ${Number(r.punchOutLocation.lng).toFixed(4)}` : 'Lat: 28.5713, Lng: 77.2199'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={r.punchOutLocation?.address}>
                            {r.punchOutLocation?.address || 'Office Location'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-mono italic pt-1 border-t border-slate-800/40">
                          Pending Log Out
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
