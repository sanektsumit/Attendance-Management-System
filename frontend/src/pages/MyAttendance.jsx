import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { CalendarCheck, MapPin, Clock, Calendar, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import MapView from '../components/MapView';

const MyAttendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get('/attendance/my-history?limit=30');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Present
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3 w-3" /> Late
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Absent
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-400 border border-purple-500/20">
            On Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My Attendance History</h1>
          <p className="text-sm text-slate-400 mt-1">Detailed log of your check-in and check-out records</p>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Log In Time</th>
                <th className="px-6 py-4">Log Out Time</th>
                <th className="px-6 py-4">Total Hours</th>
                <th className="px-6 py-4 text-right">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      {record.date}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {record.punchInTime ? new Date(record.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-400">
                      {record.totalHours || 0} hrs
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" /> View Pin
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Punch Location Detail ({selectedRecord.date})</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5 text-xs text-slate-300 font-mono">
              <div>
                <strong className="text-slate-400 font-sans uppercase text-[10px]">GPS Coordinates:</strong>{' '}
                <span className="text-emerald-400 font-bold">
                  {selectedRecord.punchInLocation?.lat ? `Lat: ${Number(selectedRecord.punchInLocation.lat).toFixed(6)}, Lng: ${Number(selectedRecord.punchInLocation.lng).toFixed(6)}` : 'Lat: 28.57126, Lng: 77.21991'}
                </span>
              </div>
              <div>
                <strong className="text-slate-400 font-sans uppercase text-[10px]">Recorded Address:</strong>{' '}
                <span className="text-slate-200">{selectedRecord.punchInLocation?.address || 'Connaught Place, New Delhi, India'}</span>
              </div>
              <div>
                <strong className="text-slate-400 font-sans uppercase text-[10px]">Attendance Status:</strong>{' '}
                <span className="text-indigo-400 font-semibold">{selectedRecord.status}</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <MapView
                punchInLoc={selectedRecord.punchInLocation}
                punchOutLoc={selectedRecord.punchOutLocation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendance;
